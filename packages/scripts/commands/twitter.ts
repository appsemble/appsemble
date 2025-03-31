import { logger } from '@appsemble/node-utils';
import { TwitterApi } from 'twitter-api-v2';

export const command = 'twitter';
export const description = 'Announce an Appsemble release on Twitter';

const {
  CI_COMMIT_TAG,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
  TWITTER_CONSUMER_API_KEY,
  TWITTER_CONSUMER_API_KEY_SECRET,
} = process.env;

// The character limit of a tweet is 280 characters. URLs count as 23 regardless of length.
// URLs won’t be rendered if the URL is at the end of the tweet. Only a preview will be rendered.
const status = `We have just released Appsemble version ${CI_COMMIT_TAG}!

Check out the release notes to find out what’s new.

#lowcode #opensource

https://gitlab.com/appsemble/appsemble/-/releases/${CI_COMMIT_TAG}`;

export async function handler(): Promise<void> {
  const twitter = new TwitterApi({
    appKey: TWITTER_CONSUMER_API_KEY!,
    appSecret: TWITTER_CONSUMER_API_KEY_SECRET!,
    accessToken: TWITTER_ACCESS_TOKEN!,
    accessSecret: TWITTER_ACCESS_TOKEN_SECRET!,
  });
  logger.info('Tweeting:');
  logger.info(status);
  const tweet = await twitter.v2.tweet(status);
  logger.info('Tweeted successfully');
  logger.info(`https://twitter.com/Appsemble_/status/${tweet.data.id}`);
}
