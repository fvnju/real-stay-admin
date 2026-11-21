import "server-only";

/**
 * Writes to one flag run one after the other in this server process, so
 * the stale check and the save of one admin are not split by the save of
 * another. Another server instance can still write between them;
 * `wasConcurrent` reports that case after the save.
 */
const locks = new Map<number, Promise<unknown>>();

export async function withFlagLock<T>(flagId: number, work: () => Promise<T>): Promise<T> {
  const before = locks.get(flagId) ?? Promise.resolve();
  const run = before.catch(() => undefined).then(work);
  locks.set(flagId, run);
  try {
    return await run;
  } finally {
    if (locks.get(flagId) === run) locks.delete(flagId);
  }
}
