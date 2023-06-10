const fetch = require('node-fetch');
const fs = require('fs');
const unionBy = require('lodash/unionBy');

const RESPONSE_SIZE = 40;

module.exports = (eleventyConfig, options) => {
	if (!options.host) {
		console.error('No URL provided for the Mastodon server.');
		return;
	}
	if (!options.userId) {
		console.error('No userID provided.');
		return;
	}

	const defaults = {
		removeSyndicates: [],
		cacheLocation: '.cache/mastodon.json',
		isProduction: true,
	};

	const config = { ...defaults, ...options };

	const MASTODON_STATUS_API = `${config.host}/api/v1/accounts/${config.userId}/statuses`;

	const formatTimeline = (timeline) => {
		const filtered = timeline.filter(
			(post) =>
				// remove posts that are already on your own site.
				!config.removeSyndicates.some((url) => post.content.includes(url))
		);
		const formatted = filtered.map((post) => {
			const images = post.media_attachments.map((image) => ({
				image: image?.url,
				alt: image?.description,
				width: image?.meta?.small?.width,
				height: image?.meta?.small?.height,
				aspect: image?.meta?.small?.aspect,
			}));
			const customEmojis = post.emojis.map((emoji) => ({
				shortcode: emoji.shortcode,
				url: emoji.static_url,
			}));
			return {
				date: new Date(post.created_at).toISOString(),
				id: post.id,
				content: post.content,
				source_url: post.url,
				site: 'Mastodon',
				media: images,
				emojis: customEmojis,
			};
		});
		const goodPosts = formatted.filter((post) => {
			if (post.media && post.media.alt === null) {
				return false;
			}
			return true;
		});

		return goodPosts;
	};

	const fetchAllMastodonPosts = async () => {
		let posts = [];
		let nextResponse = posts;
		do {
			nextResponse = await fetchMastodonPosts({
				beforePost: nextResponse[nextResponse.length - 1] || undefined,
			});
			// mergePosts expects a cached object {lastfetched: ..., posts: ...} as the first parameter
			posts = mergePosts({ posts }, nextResponse);
		} while (nextResponse.length !== 0);
		return posts;
	};

	const fetchMastodonPosts = async ({
		lastPost = undefined,
		beforePost = undefined,
	}) => {
		const queryParams = new URLSearchParams({
			limit: `${RESPONSE_SIZE}`,
			exclude_replies: 'true',
			exclude_reblogs: 'true',
		});
		if (lastPost) {
			queryParams.set('since_id', lastPost.id);
			console.log(`>>> Requesting posts made after ${lastPost.date}...`);
		}
		if (beforePost) {
			queryParams.set('max_id', beforePost.id);
			console.log(`>>> Requesting posts made before ${beforePost.date}...`);
		}
		const url = new URL(`${MASTODON_STATUS_API}?${queryParams}`);
		const response = await fetch(url.href);
		if (response.ok) {
			const feed = await response.json();
			const timeline = formatTimeline(feed);
			console.log(`>>> ${timeline.length} new mastodon posts fetched`);
			return timeline;
		}
		console.warn('>>> unable to fetch mastodon posts', response.statusText);
		return null;
	};

	const readFromCache = () => {
		if (fs.existsSync(config.cacheLocation)) {
			const cacheFile = fs.readFileSync(config.cacheLocation);
			return JSON.parse(cacheFile.toString());
		}
		// no cache found.
		return { lastFetched: null, posts: [] };
	};

	const writeToCache = (data) => {
		const dir = '.cache';
		const fileContent = JSON.stringify(data, null, 2);
		// create cache folder if it doesnt exist already
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		// write data to cache json file
		fs.writeFile(config.cacheLocation, fileContent, (err) => {
			if (err) throw err;
			console.log(
				`>>> ${data.posts.length} mastodon posts in total are now cached in ${config.cacheLocation}`
			);
		});
	};

	// Merge fresh posts with cached entries, unique per id
	const mergePosts = (cache, feed) => {
		const merged = unionBy(cache.posts, feed, 'id');
		return merged
			.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
			.reverse();
	};

	eleventyConfig.addGlobalData('mastodon', async () => {
		let lastPost;
		console.log('>>> Reading mastodon posts from cache...');
		const cache = readFromCache();

		if (cache.posts.length) {
			console.log(`>>> ${cache.posts.length} mastodon posts loaded from cache`);
			lastPost = cache.posts[0];
		}

		// Only fetch new posts in production
		if (config.isProduction) {
			let feed;
			if (cache.posts.length === 0) {
				console.log(
					'>>> Creating a complete archive of your mastodon posts...'
				);
				feed = await fetchAllMastodonPosts();
				console.log(
					`>>> Archive containing ${feed.length} posts has been fetched...`
				);
			} else {
				console.log('>>> Checking for new mastodon posts...');
				feed = await fetchMastodonPosts({ lastPost });
			}
			if (feed) {
				const mastodonPosts = {
					lastFetched: new Date().toISOString(),
					posts: mergePosts(cache, feed),
				};

				writeToCache(mastodonPosts);
				return mastodonPosts;
			}
		}

		return cache;
	});
};
