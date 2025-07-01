import type { InferInsertModel } from 'drizzle-orm';
import { WebClient } from '@slack/web-api';
import { db } from '@/lib/db/script-connection';
import { eq } from 'drizzle-orm';
import { slackUser, slackMessage } from '@/lib/db/schema.f3';
import { generateSk } from './utils';

const SLACK_BOT_USER_OAUTH_TOKEN = process.env.SLACK_BOT_USER_OAUTH_TOKEN;

type SlackUser = InferInsertModel<typeof slackUser>;
type SlackMessage = InferInsertModel<typeof slackMessage>;

export async function seedSlack() {
  console.debug('seeding slack...');
  // await seedSlackUsers();
  await seedSlackMessages();
}

async function seedSlackUsers() {
  console.debug('seeding slack users...');
  const users = fetchSlackUsers();
  let i = 0;
  for await (const user of users) {
    i += 1;
    const { userId, ...rest } = user;
    await db
      .insert(slackUser)
      .values(user)
      .onConflictDoUpdate({
        target: [slackUser.userId],
        set: rest,
      });
    console.debug(`inserted slack user ${i}: ${user.userId} ${user.displayName}`);
  }
  console.debug(`seeded ${i} slack users`);
}

async function* fetchSlackUsers(): AsyncGenerator<SlackUser> {
  if (!SLACK_BOT_USER_OAUTH_TOKEN) {
    throw new Error('SLACK_BOT_USER_OAUTH_TOKEN environment variable is required');
  }
  const client = new WebClient(SLACK_BOT_USER_OAUTH_TOKEN);
  
  try {
    const result = await client.users.list({});
    
    if (!result.ok) {
      console.error('Failed to fetch Slack users:', result.error);
      return;
    }

    const users = result.members || [];
    console.debug(`fetched ${users.length} slack users`);
    
    for (const user of users) {
      if (user.id && !user.is_bot && !user.deleted) {
        yield {
          userId: user.id,
          displayName: user.profile?.display_name || user.name || '',
          fullName: user.real_name || user.profile?.real_name || '',
          email: user.profile?.email || '',
        } as SlackUser;
      }
    }
  } catch (error) {
    console.error('Error fetching Slack users:', error);
  }
}

async function seedSlackMessages() {
  console.debug('seeding slack messages...');
  const messages = fetchSlackMessages();
  let i = 0;
  for await (const message of messages) {
    i += 1;
    await db.insert(slackMessage).values(message).onConflictDoUpdate({
      target: [slackMessage.sk],
      set: message,
    });
    console.debug(`inserted slack message ${i}: ${message.channelName} ${message.messageId}`);
  }
  console.debug(`seeded ${i} slack messages`);
}

async function* fetchSlackMessages(): AsyncGenerator<SlackMessage> {
  if (!SLACK_BOT_USER_OAUTH_TOKEN) {
    throw new Error('SLACK_BOT_USER_OAUTH_TOKEN environment variable is required');
  }
  const client = new WebClient(SLACK_BOT_USER_OAUTH_TOKEN);
  /** @see https://api.slack.com/methods/conversations.list#examples */
  const channels = await client.conversations.list({
    exclude_archived: true,
    types: 'public_channel,private_channel'
  });
  if (!channels.ok || !channels.channels) {
    throw new Error(`Failed to fetch Slack channels: ${channels.error}`)
  }
  
  // Filter to only channels where the bot is a member
  const botChannels = channels.channels.filter(channel => channel.is_member);
  console.debug(`Found ${botChannels.length} channels where bot is a member out of ${channels.channels.length} total channels`);
  
  for (let i = 0; i < botChannels.length; i++) {
    const channel = botChannels[i]!;
    if (!channel.id) {
      console.warn(`Skipping channel ${channel.name} because it has no ID`);
      continue;
    }
    
    console.debug(`Fetching messages from channel: ${channel.name}`);
    let cursor: string | undefined;
    let messageCount = 0;
    
    // Use pagination to fetch all messages from the channel
    while (true) {
      const messages = await client.conversations.history({
        channel: channel.id,
        /** 
         * Maximum of 999 
         * @see https://api.slack.com/methods/conversations.history
        */
        limit: 999,
        cursor,
      });
      
      if (!messages.ok || !messages.messages) {
        throw new Error(`Failed to fetch Slack messages: ${messages.error}`)
      }
      
      messageCount += messages.messages.length;
      console.debug(`Fetched ${messages.messages.length} messages from ${channel.name} (total: ${messageCount})`);
      
      for (let j = 0; j < messages.messages.length; j++) {
        const message = messages.messages[j]!;
        
        // Skip messages without required fields
        if (!message.user || !message.ts) {
          console.warn(`Skipping message in ${channel.name} because it's missing user or timestamp`);
          continue;
        }
        
        const [messageAuthor] = await db.select().from(slackUser).where(eq(slackUser.userId, message.user)).limit(1);
        if (!messageAuthor) {
          console.warn(`Skipping message ${channel.name} ${message.ts} because the author ${message.user} does not exist`);
          continue;
        }
        
        yield {
          sk: generateSk(channel.id!, message.ts),
          channelId: channel.id,
          channelName: channel.name || 'unknown',
          messageId: message.ts,
          messageText: message.text || '',
          messageAuthor: messageAuthor.userId,
        } as SlackMessage;
      }
      
      // Check if there are more messages to fetch
      cursor = messages.response_metadata?.next_cursor;
      if (!cursor) {
        break;
      }
    }
    
    console.debug(`Completed fetching messages from ${channel.name} (total: ${messageCount})`);
  }
}