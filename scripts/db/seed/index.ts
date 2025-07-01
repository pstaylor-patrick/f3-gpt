import { seedBackblasts } from '@/scripts/db/backblasts/seed/index';

export async function seed() {
  console.debug('🌱 seeding database...');
  await seedBackblasts();
}