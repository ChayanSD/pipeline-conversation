import { redis } from './redis';
import { NextResponse } from 'next/server';

interface CachedResponse {
  data: unknown;
  status: number;
  headers?: Record<string, string>;
}

export async function withCache(
  key: string,
  fetcher: () => Promise<NextResponse>,
  ttl: number = 300 // 5 minutes default
): Promise<NextResponse> {
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      let parsed: CachedResponse;
      if (typeof cached === 'string') {
        parsed = JSON.parse(cached);
      } else {
        parsed = cached as CachedResponse;
      }
      return NextResponse.json(parsed.data, {
        status: parsed.status,
        headers: parsed.headers,
      });
    }

    // Not in cache, fetch fresh data
    const response = await fetcher();

    // Clone the response to read the body
    const responseClone = response.clone();
    const data = await responseClone.json();
    const status = response.status;
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Cache the response
    const cacheData: CachedResponse = {
      data,
      status,
      headers,
    };
    await redis.set(key, JSON.stringify(cacheData), { ex: ttl });

    return response;
  } catch (error) {
    console.error('Cache error:', error);
    return await fetcher();
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}