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
import { withCache, invalidateCache } from '@/lib/cache';

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

    const { name, companyName, passCode, primaryColor, secondaryColor, companyRole, profileImageUrl: formProfileImageUrl, companyLogoUrl } = result.data;

    // Filter out empty strings
    const hasProfileImageUrl = formProfileImageUrl && formProfileImageUrl.trim() !== '';
    const hasCompanyLogoUrl = companyLogoUrl && companyLogoUrl.trim() !== '';

    // Check if there's anything to update
    if (!name && !companyName && !passCode && !primaryColor && !secondaryColor && !companyRole && !hasProfileImageUrl && !hasCompanyLogoUrl) {
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
    if (hasProfileImageUrl) updateData.profileImageUrl = formProfileImageUrl;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      include: {
        company: true,
      },
    });

    // If primaryColor or secondaryColor was updated, update all invited users' colors
    if (primaryColor || secondaryColor) {
      try {
        // Find all accepted invitations sent by this user
        const acceptedInvitations = await prisma.invitation.findMany({
          where: {
            invitedById: session.id,
            status: 'ACCEPTED',
          },
          select: {
            email: true,
          },
        });

        if (acceptedInvitations.length > 0) {
          // Get the emails of invited users
          const invitedUserEmails = acceptedInvitations.map(inv => inv.email);

          // Prepare color update data for invited users
          const invitedUserColorUpdate: {
            primaryColor?: string;
            secondaryColor?: string;
          } = {};

          if (primaryColor) {
            invitedUserColorUpdate.primaryColor = primaryColor;
          }
          if (secondaryColor) {
            invitedUserColorUpdate.secondaryColor = secondaryColor;
          }

          // Update all invited users' colors
          await prisma.user.updateMany({
            where: {
              email: { in: invitedUserEmails },
            },
            data: invitedUserColorUpdate,
          });
        }
      } catch (error) {
        // Log error but don't fail the profile update
        console.error('Error updating invited users colors:', error);
      }
    }

    // Update company name and logo if provided
    const companyUpdateData: { name?: string; logoUrl?: string } = {};
    if (companyName && companyName !== session.company?.name) {
      companyUpdateData.name = companyName;
    }
    if (hasCompanyLogoUrl && companyLogoUrl !== session.company?.logoUrl) {
      companyUpdateData.logoUrl = companyLogoUrl;
    }
    
    if (Object.keys(companyUpdateData).length > 0) {
      const updatedCompany = await prisma.company.update({
        where: { id: session.companyId },
        data: companyUpdateData,
      });
      // Update the company in the user object
      if (companyUpdateData.name) updatedUser.company.name = updatedCompany.name;
      if (companyUpdateData.logoUrl) updatedUser.company.logoUrl = updatedCompany.logoUrl;
    }

    // Delete old session and create new one with updated data
    await deleteSession();
    const sessionId = await createSession(updatedUser);
    await setSessionCookie(sessionId);

    // Invalidate profile cache
    await invalidateCache(`profile:${session.id}`);

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

    const userId = session.id;

    return withCache(`profile:${userId}`, async () => {
      return NextResponse.json(
        {
          user: session,
        },
        { status: 200 }
      );
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}