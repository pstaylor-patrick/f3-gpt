import { slackMessage, slackUser } from '@/lib/db/schema.f3';
import { db } from '@/lib/db/script-connection';
import { count } from 'drizzle-orm';

export async function resetSlack() {
  console.debug('resetting slack...');
  await deleteSlackMessages();
  await deleteSlackUsers();
}

async function deleteSlackMessages() {
  const [res] = await db.select({ total: count() }).from(slackMessage);
  const total = res?.total;
  console.debug(`deleting ${total} slack messages...`);
  await db.delete(slackMessage).execute();
  console.debug(`deleted ${total} slack messages`);
}

async function deleteSlackUsers() {
  const [res] = await db.select({ total: count() }).from(slackUser);
  const total = res?.total;
  console.debug(`deleting ${total} slack users...`);
  await db.delete(slackUser).execute();
  console.debug(`deleted ${total} slack users`);
}