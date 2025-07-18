import { writeFile } from "fs/promises";
import xml from "xml";

import { logger } from "./util";

type Post = { title: string; date: string; content: string; link: string };

function buildFeed(posts: Post[]) {
  const sortedPosts = posts.sort(
    (first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime(),
  );

  const feedItems = [];

  feedItems.push(
    ...sortedPosts.map((post) => {
      return {
        item: [
          { title: post.title },
          {
            pubDate: new Date(post.date as string).toUTCString(),
          },
          {
            guid: [{ _attr: { isPermaLink: true } }, post.link],
          },
          {
            description: {
              _cdata: post.content,
            },
          },
        ],
      };
    }),
  );

  return feedItems;
}

export const writeRssFeed = async (
  feedName: string,
  posts: Post[],
): Promise<void> => {
  logger.info(`Creating feed for ${feedName} 📚`);

  if (posts.length === 0) {
    throw new Error(`No posts found for ${feedName}`);
  }
  const feedObject = {
    rss: [
      {
        _attr: {
          version: "2.0",
          "xmlns:atom": "http://www.w3.org/2005/Atom",
        },
      },
      {
        channel: [
          {
            "atom:link": {
              _attr: {
                href: `https://bullrich.dev/tldr-rss/${feedName}.rss`,
                rel: "self",
                type: "application/rss+xml",
              },
            },
          },
          {
            title: `TLDR ${feedName.toLocaleUpperCase()} Feed`,
          },
          {
            link: "https://bullrich.dev/tldr-rss/",
          },
          { description: "TLDR RSS Feed" },
          { language: "en-US" },
          {
            image: [
              {
                url: "https://tldr.tech/tldrsquare.png",
                title: "TLDR RSS Feed",
                link: "https://tldr.tech",
              },
            ],
          },
          ...buildFeed(posts),
        ],
      },
    ],
  };

  const feed = '<?xml version="1.0" encoding="UTF-8"?>' + xml(feedObject);

  await writeFile(`./site/${feedName}.rss`, feed, "utf8");
};
