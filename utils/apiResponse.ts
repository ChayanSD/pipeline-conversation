import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | null;
  error?: unknown;
  status: number;
}

export function apiResponse<T>(
  success: boolean,
  message: string,
  status: number,
  data?: T | null
) {
  const response: ApiResponse<T> = {
    success,
    message,
    data: data ?? null,
    status,
  };

  return NextResponse.json(response, { status });
}

export function apiError(message: string, status: number, error?: unknown) {
  const response: ApiResponse = {
    success: false,
    message,
    status,
    error: error ?? null,
  };

  return NextResponse.json(response, { status });
}
