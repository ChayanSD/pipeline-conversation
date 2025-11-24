import { NextResponse } from 'next/server';
import { withCache } from '@/lib/cache';

export async function GET() {
  return withCache('theme', async () => {
    // Mock theme data - in a real app, this would come from a database
    const theme = {
      primary: '#0A9BFF',
      secondary: '#F7AF41'
    };

    return NextResponse.json(theme);
  });
}
