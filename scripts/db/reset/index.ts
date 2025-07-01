import { resetBackblasts } from '../backblasts/reset';

export async function reset() {
  console.debug('🔄 resetting database...');
  await resetBackblasts();
}