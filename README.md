# eleventy-plugin-mastoarchive

> Fetch your own posts from Mastodon so you can display them on your personal website.

## To Use

First install the plugin in your project:

```shell
npm i eleventy-plugin-mastoarchive
```

Then include it in your Eleventy project file

```js
const mastoArchive = require('../eleventy-plugin-mastoarchive');

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(mastoArchive, {
    host: MASTODON_SERVER,
    userId: MASTODON_USER_ID,
    removeSyndicates: ['example.com'],
  });
```

This will expose a global data object called `mastodon` which you can use in your Eleventy project.

## Config Options

| Option           | Type     | Default                |
| ---------------- | -------- | ---------------------- |
| host             | string   |                        |
| userId           | string   |                        |
| removeSyndicates | string[] | []                     |
| cacheLocation    | string   | ".cache/mastodon.json" |
| isProduction     | boolean  | true                   |

The `host` and `userId` are required for the plugin to work. The plugin will error if these are not provided.

## mastodon global data object

The `mastodon` object has the following properties:

| Property    | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| lastFetched | an ISO string indicating the last time the posts were fetched |
| posts       | an array of posts                                             |

### Mastodon posts

Each Mastodon post has the following properties:

| Property   | Description                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| date       | The timestamp of the published post.                                                                                      |
| id         | The internal ID of the post on the Mastodon server.                                                                       |
| content    | The HTML of the post as it is displayed in the Mastodon UI.                                                               |
| source_url | The original URL of the post.                                                                                             |
| site       | Hard coded to "Mastodon".                                                                                                 |
| media      | An object if a single image or no image is attached to the post, or an array if multiple images are attached to the post. |

### Media objects

If the post contains a one or more images, the media property on the post will contain the following data:

| image  | The URL of the image on the Mastodon server. |
| ------ | -------------------------------------------- |
| alt    | The ALT text of the image.                   |
| width  | The width of the image in pixels.            |
| height | The height of the image in pixels.           |
| aspect | The aspect ratio of the image.               |
