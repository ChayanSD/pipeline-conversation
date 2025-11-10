import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { randomUUID } from "crypto";
import transport from "@/lib/nodemailer";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { email, presentationId } = await request.json();

    if (!email || !presentationId) {
      return NextResponse.json(
        { error: "Email and presentation ID are required" },
        { status: 400 }
      );
    }

    // Verify the presentation exists and belongs to the user
    const presentation = await prisma.presentation.findUnique({
      where: { id: presentationId },
      include: { user: { include: { company: true } } },
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (presentation.userId !== session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      // User already exists - share the audit with them directly
      // Check if audit is already shared with this user
      const existingShare = await prisma.sharedAudit.findUnique({
        where: {
          userId_presentationId: {
            userId: existingUser.id,
            presentationId: presentationId,
          },
        },
      });

      if (existingShare) {
        return NextResponse.json(
          { error: "Audit is already shared with this user" },
          { status: 409 }
        );
      }

      // Create shared audit record
      await prisma.sharedAudit.create({
        data: {
          userId: existingUser.id,
          presentationId: presentationId,
          sharedById: session.id,
        },
      });

      // Send email with login link
      const loginLink = `${process.env.APP_URL || 'http://localhost:3000'}/signin`;
      
      await transport.sendMail({
        from: "chayansd5656@gmail.com",
        to: email,
        subject: `New audit shared with you: ${presentation.title}`,
        text: `A new audit "${presentation.title}" has been shared with you. Please log in to access it: ${loginLink}`,
        html: `
          <div>
            <h2>New audit shared with you</h2>
            <p><strong>Audit:</strong> ${presentation.title}</p>
            <p>Please log in using the link below to access the audit:</p>
            <a href="${loginLink}" style="display: inline-block; padding: 10px 20px; background-color: #2B4055; color: white; text-decoration: none; border-radius: 5px;">Log In & View Audit</a>
          </div>
        `,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Audit shared successfully with existing user",
          data: { userId: existingUser.id, presentationId },
        },
        { status: 200 }
      );
    }

    // User doesn't exist - create invitation for signup
    // Check if there's already a pending invitation for this email and presentation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        presentationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent for this audit" },
        { status: 409 }
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invitation.create({
      data: {
        email,
        companyId: presentation.user.companyId,
        invitedById: session.id,
        role: "USER",
        token,
        expiresAt,
        presentationId,
      },
    });

    // Send email with signup invitation link
    const invitationLink = `${process.env.APP_URL || 'http://localhost:3000'}/signup?token=${token}`;
    
    await transport.sendMail({
      from: "chayansd5656@gmail.com",
      to: email,
      subject: `Invitation to take audit: ${presentation.title}`,
      text: `You have been invited to take the audit "${presentation.title}". Please sign up using this link: ${invitationLink}`,
      html: `
        <div>
          <h2>You have been invited to take an audit</h2>
          <p><strong>Audit:</strong> ${presentation.title}</p>
          <p>Please sign up using the link below:</p>
          <a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2B4055; color: white; text-decoration: none; border-radius: 5px;">Sign Up & Start Audit</a>
          <p>This invitation will expire in 7 days.</p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent successfully",
        data: invite,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Audit Invite Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

