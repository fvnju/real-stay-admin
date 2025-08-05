import type { NextRequest, NextResponse } from "next/server";

type POST = (request: NextRequest) => Promise<NextResponse<any>>;
type PostReturnType<T extends POST> = ReturnType<T>;

// Since ReturnType gives us a Promise<NextResponse<...>>, we unwrap the Promise first
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Then extract the type inside NextResponse
type ExtractInnerNextResponse<T> = T extends NextResponse<infer U> ? U : never;

// Final type
export type InnerResponseType<T extends POST> = ExtractInnerNextResponse<
  UnwrapPromise<PostReturnType<T>>
>;

export type AuthApiError = {
  data: { message: string; path: string };
  success: false;
};
