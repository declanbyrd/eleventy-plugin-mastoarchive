# eleventy-plugin-mastoarchive

> Fetch your own public posts from Mastodon so you can display them on your personal website.

## Getting Started

First install the plugin in your project:

```shell
npm i eleventy-plugin-mastoarchive
```

Then include it in your Eleventy project file

```js
const mastoArchive = require('eleventy-plugin-mastoarchive');

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(mastoArchive, {
    host: MASTODON_SERVER,
    userId: MASTODON_USER_ID,
    removeSyndicates: ['example.com'],
  });
```

This will expose a global data object called `mastodon` which you can use in your Eleventy project.

## Getting your Mastodon User ID

I was able to retrieve my Mastodon user ID by monitoring the network requests made by the Mastodon server I belong to. On a device that is able to open developer tools, the steps I took were to:

- With the developer tools open and the Network traffic visible, enter your username in the search box and trigger the network request by pressing enter on your keyboard.
- Find the request that looks like `https://{mastodon_server}/api/v2/search?q=@{your_mastodon_username}` and open the response for that request. The response object should look like the one below.
- Your account should be the first one that appears under `accounts`. The id of that account is your Mastodon user ID.

```json
{
    "accounts":[
        {
            "id": {your user ID},
            "username": {your Mastodon username},
            ...
        }
    ],
    "statuses":[],
    "hashtags":[]
}
```

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
| emoji      | An array of custom emojis that were used in the post.                                                                     |

### Media objects

If the post contains a one or more images, the media property on the post will contain the following data:

| Property | Description                                  |
| -------- | -------------------------------------------- |
| image    | The URL of the image on the Mastodon server. |
| alt      | The ALT text of the image.                   |
| width    | The width of the image in pixels.            |
| height   | The height of the image in pixels.           |
| aspect   | The aspect ratio of the image.               |

### Custom emoji

If your post contains custom emoji, the emoji property will contain the following data:

| Property  | Description                                                  |
| --------- | ------------------------------------------------------------ |
| shortcode | The shortcode for the emoji. In the format `:<emoji name>:`. |
| url       | The static URL of the image on the Mastodon server.          |
