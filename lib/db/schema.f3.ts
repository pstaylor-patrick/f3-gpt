import {
  timestamp,
  date,
  varchar,
  integer,
  text,
  uuid,
  pgSchema,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

const f3Schema = pgSchema('f3');

export const backblast = f3Schema.table('Backblast', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  sk: varchar('sk', { length: 255 }).unique().notNull(),
  ingestedAt: timestamp('ingestedAt').notNull().defaultNow(),
  date: date('date').notNull(),
  ao: varchar('ao', { length: 64 }).notNull(),
  q: varchar('q', { length: 64 }).notNull(),
  pax_count: integer('pax_count').notNull(),
  fngs: varchar('fngs', { length: 255 }).notNull(),
  fng_count: integer('fng_count').notNull(),
  backblast: text('backblast').notNull(),
});

export type Backblast = InferSelectModel<typeof backblast>;

export const slackUser = f3Schema.table('SlackUser', {
  userId: varchar('userId', { length: 255 }).primaryKey(),
  displayName: varchar('displayName', { length: 255 }).notNull(),
  fullName: varchar('fullName', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  ingestedAt: timestamp('ingestedAt').notNull().defaultNow(),
});

export type SlackUser = InferSelectModel<typeof slackUser>;

export const slackMessage = f3Schema.table('SlackMessage', {
  sk: varchar('sk', { length: 255 }).primaryKey(),
  channelId: varchar('channelId', { length: 255 }).notNull(),
  channelName: varchar('channelName', { length: 255 }).notNull(),
  messageId: varchar('messageId', { length: 255 }).notNull(),
  messageText: text('messageText').notNull(),
  messageAuthor: varchar('messageAuthor', { length: 255 }).references(() => slackUser.userId).notNull(),
  ingestedAt: timestamp('ingestedAt').notNull().defaultNow(),
});

export type SlackMessage = InferSelectModel<typeof slackMessage>;