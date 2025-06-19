import 'server-only';

import { and, count, desc, eq, gte, lte, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { backblast } from './schema.f3';
import { ChatSDKError } from '../errors';
import { generateSk } from './utils.f3';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export async function createBackblast({
  date,
  ao,
  q,
  pax_count,
  fngs,
  fng_count,
  backblast_text,
}: {
  date: string;
  ao: string;
  q: string;
  pax_count: number;
  fngs: string;
  fng_count: number;
  backblast_text: string;
}) {
  try {
    return await db
      .insert(backblast)
      .values({
        sk: generateSk(date, ao, q),
        date,
        ao,
        q,
        pax_count,
        fngs,
        fng_count,
        backblast: backblast_text,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create backblast',
    );
  }
}

export async function getBackblastById({ id }: { id: string }) {
  try {
    const [selectedBackblast] = await db
      .select()
      .from(backblast)
      .where(eq(backblast.id, id));
    return selectedBackblast;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get backblast by id',
    );
  }
}

export async function getAllBackblasts({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}) {
  try {
    return await db
      .select()
      .from(backblast)
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all backblasts',
    );
  }
}

export async function getBackblastsByDateRange({
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}: {
  startDate: string;
  endDate: string;
  limit?: number;
  offset?: number;
}) {
  try {
    return await db
      .select()
      .from(backblast)
      .where(and(gte(backblast.date, startDate), lte(backblast.date, endDate)))
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get backblasts by date range',
    );
  }
}

export async function getBackblastsByAO({
  ao,
  limit = 50,
  offset = 0,
}: {
  ao: string;
  limit?: number;
  offset?: number;
}) {
  try {
    return await db
      .select()
      .from(backblast)
      .where(like(backblast.ao, `%${ao}%`))
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get backblasts by AO',
    );
  }
}

export async function getBackblastsByQ({
  q,
  limit = 50,
  offset = 0,
}: {
  q: string;
  limit?: number;
  offset?: number;
}) {
  try {
    return await db
      .select()
      .from(backblast)
      .where(like(backblast.q, `%${q}%`))
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get backblasts by Q',
    );
  }
}

export async function updateBackblast({
  id,
  date,
  ao,
  q,
  pax_count,
  fngs,
  fng_count,
  backblast_text,
}: {
  id: string;
  date: string;
  ao: string;
  q: string;
  pax_count: number;
  fngs: string;
  fng_count: number;
  backblast_text: string;
}) {
  try {
    return await db
      .update(backblast)
      .set({
        date,
        ao,
        q,
        pax_count,
        fngs,
        fng_count,
        backblast: backblast_text,
      })
      .where(eq(backblast.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update backblast',
    );
  }
}

export async function deleteBackblastById({ id }: { id: string }) {
  try {
    const [deletedBackblast] = await db
      .delete(backblast)
      .where(eq(backblast.id, id))
      .returning();
    return deletedBackblast;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete backblast by id',
    );
  }
}

export async function getBackblastStats({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  try {
    const [stats] = await db
      .select({
        totalBackblasts: count(backblast.id),
        totalPax: count(backblast.pax_count),
        totalFNGs: count(backblast.fng_count),
      })
      .from(backblast)
      .where(and(gte(backblast.date, startDate), lte(backblast.date, endDate)))
      .execute();

    return stats;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get backblast stats',
    );
  }
}

export async function getTopAOs({
  limit = 10,
  startDate,
  endDate,
}: {
  limit?: number;
  startDate: string;
  endDate: string;
}) {
  try {
    return await db
      .select({
        ao: backblast.ao,
        count: count(backblast.id),
      })
      .from(backblast)
      .where(and(gte(backblast.date, startDate), lte(backblast.date, endDate)))
      .groupBy(backblast.ao)
      .orderBy(desc(count(backblast.id)))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get top AOs');
  }
}

export async function getTopQs({
  limit = 10,
  startDate,
  endDate,
}: {
  limit?: number;
  startDate: string;
  endDate: string;
}) {
  try {
    return await db
      .select({
        q: backblast.q,
        count: count(backblast.id),
      })
      .from(backblast)
      .where(and(gte(backblast.date, startDate), lte(backblast.date, endDate)))
      .groupBy(backblast.q)
      .orderBy(desc(count(backblast.id)))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get top Qs');
  }
}

export async function searchBackblasts({
  searchTerm,
  limit = 50,
  offset = 0,
}: {
  searchTerm: string;
  limit?: number;
  offset?: number;
}) {
  try {
    return await db
      .select()
      .from(backblast)
      .where(like(backblast.backblast, `%${searchTerm}%`))
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to search backblasts',
    );
  }
}

export async function getRecentBackblasts({
  days = 30,
  limit = 20,
}: {
  days?: number;
  limit?: number;
} = {}) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    return await db
      .select()
      .from(backblast)
      .where(gte(backblast.date, cutoffDateString))
      .orderBy(desc(backblast.date), desc(backblast.ingestedAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get recent backblasts',
    );
  }
}
