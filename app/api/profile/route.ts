import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UpdateProfileSchema } from '@/validation/update-profile.validation';

import {
  getSession,
  createSession,
  deleteSession,
  setSessionCookie,
} from '@/lib/session';
import prisma from '@/lib/db';

export async function PATCH(request: NextRequest) : Promise<NextResponse> {
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

    const { name, companyName, passCode, primaryColor, secondaryColor, companyRole, profileImageUrl: formProfileImageUrl } = result.data;

    // Check if there's anything to update
    if (!name && !companyName && !passCode && !primaryColor && !secondaryColor && !companyRole && !formProfileImageUrl) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<{
      name: string;
      passCode: string;
      primaryColor: string;
      secondaryColor: string;
      companyRole: string;
      profileImageUrl: string;
    }> = {};
    if (name) updateData.name = name;
    if (passCode) updateData.passCode = await bcrypt.hash(passCode, 10);
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (companyRole) updateData.companyRole = companyRole;
    if (formProfileImageUrl) updateData.profileImageUrl = formProfileImageUrl;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      include: {
        company: true,
      },
    });

    // Update company name if provided
    if (companyName && companyName !== session.company?.name) {
      await prisma.company.update({
        where: { id: session.companyId },
        data: { name: companyName },
      });
      // Update the company in the user object
      updatedUser.company.name = companyName;
    }

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
          companyId: updatedUser.companyId,
          primaryColor: updatedUser.primaryColor,
          secondaryColor: updatedUser.secondaryColor,
          profileImageUrl: updatedUser.profileImageUrl,
          companyRole: updatedUser.companyRole,
          company: updatedUser.company ? {
            id: updatedUser.company.id,
            name: updatedUser.company.name,
            logoUrl: updatedUser.company.logoUrl,
          } : undefined,
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
export async function GET() : Promise<NextResponse> {
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