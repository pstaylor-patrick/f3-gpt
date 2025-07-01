export function generateSk(channelId: string, messageId: string) {
  const sk = `${channelId}-${messageId}`;
  const maxLen = 255;
  if (sk.length > maxLen) {
    throw new Error(`surrogate key (sk) is too long: ${sk.length} > ${maxLen}`);
  }
  return sk;
}