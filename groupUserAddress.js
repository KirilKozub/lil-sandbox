export function groupUserAddresses(entries) {
  /** @type {Record<string, Record<string, Record<string, unknown>>>} */
  const result = {};

  entries.forEach(([rawKey, payload]) => {
    const parts = rawKey.split('_');

    // userType = parts[0]
    const userType = parts[0];

    // userId = join всё кроме userType и последнего addressType
    const addressType = parts[parts.length - 1];
    const userId = parts.slice(1, -1).join('_');

    if (!result[userType]) {
      result[userType] = {};
    }

    if (!result[userType][userId]) {
      result[userType][userId] = {};
    }

    result[userType][userId][addressType] = payload;
  });

  return result;
}