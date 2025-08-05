export type Result<T, E = Error> =
  | { data: T; error: null }
  | { data: null; error: E };

export async function safeReturn<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as E };
  }
}
