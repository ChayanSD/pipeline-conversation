import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getSession,
  createSession,
  deleteSession,
  setSessionCookie,
} from '@/lib/session';
import prisma from '@/lib/db';

const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.email('Invalid email address').optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const result = UpdateProfileSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error },
        { status: 400 }
      );
    }

    const { name, email } = result.data;

    // Check if there's anything to update
    if (!name && !email) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // If email is being changed, check if it's already taken
    if (email && email !== session.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    // Delete old session and create new one with updated data
    await deleteSession();
    const sessionId = await createSession(updatedUser);
    await setSessionCookie(sessionId);

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to fetch current user profile
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}