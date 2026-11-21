/**
 * The message of a failed request: the old routes send it in
 * `data.data.message`, the v1 routes in `data.error` (or `data.message`).
 */
export const GetErrorMessage = (error: any): string => {
  const message =
    error?.data?.data?.message ??
    (typeof error?.data?.error === "string" ? error.data.error : undefined) ??
    (typeof error?.data?.message === "string" ? error.data.message : undefined);
  if (!message) {
    console.error("currently in util GetErrorMessage");
    console.error("Unexpected error format:", error);
  }

  return message || "An unexpected error occurred";
};
