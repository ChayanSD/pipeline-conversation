import { NextResponse } from 'next/server';

export async function GET() {
  // Mock theme data - in a real app, this would come from a database
  const theme = {
    primary: '#0A9BFF',
    secondary: '#F7AF41'
  };

  return NextResponse.json(theme);
}
