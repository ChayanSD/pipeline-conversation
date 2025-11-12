import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { AuditCreateSchema } from "@/validation/audit.validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.id;
    const body = await req.json();

    const parsed = AuditCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const audit = await prisma.presentation.create({
      data: {
        title: data.title,
        userId: userId,
        categories: {
          create: data.categories.map((cat) => ({
            name: cat.name,
            icon: (cat.icon && cat.icon.trim()) ? cat.icon.trim() : null,
            questions: {
              create: cat.questions.map((q) => ({
                text: q.text,
                options: {
                  create: q.options.map((opt) => ({
                    text: opt.text,
                    points: opt.points,
                  })),
                },
              })),
            },
          })),
        },
        ...(data.summary && {
          summary: {
            create: {
              categoryRecommendations: data.summary.categoryRecommendations
                ? JSON.stringify(data.summary.categoryRecommendations)
                : null,
              nextSteps: data.summary.nextSteps
                ? JSON.stringify(data.summary.nextSteps)
                : null,
              overallDetails: data.summary.overallDetails || null,
            },
          },
        }),
      },
      include: {
        categories: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        summary: true,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Audit created successfully",
        data: audit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating audit:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.id;
    
    // Check if user was invited via audit invitation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has an accepted invitation with a presentationId (for invited users who signed up)
    const acceptedInvitation = await prisma.invitation.findFirst({
      where: {
        email: user.email,
        status: "ACCEPTED",
        presentationId: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all audits shared with this user
    const sharedAudits = await prisma.sharedAudit.findMany({
      where: {
        userId: userId,
      },
      select: {
        presentationId: true,
      },
    });

    const sharedAuditIds = sharedAudits.map(sa => sa.presentationId);

    let whereClause: 
      | { id: { in: string[] } }
      | { OR: Array<{ userId: string } | { id: { in: string[] } }> }
      | { userId: string };
    
    if (acceptedInvitation?.presentationId) {
      // User was invited to a specific audit via signup - show that audit + any shared audits
      const auditIds = [acceptedInvitation.presentationId, ...sharedAuditIds];
      whereClause = {
        id: { in: auditIds },
      };
    } else if (sharedAuditIds.length > 0) {
      // User has shared audits - show their own audits + shared audits
      whereClause = {
        OR: [
          { userId: userId },
          { id: { in: sharedAuditIds } },
        ],
      };
    } else {
      // Normal user - show all their audits
      whereClause = {
        userId: userId,
      };
    }

    const audits = await prisma.presentation.findMany({
      where: whereClause,
      include: {
        categories: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        tests: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get only the latest test
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine if user is an invited user (signed up via invitation) - they can't create audits
    // Users who signed up via invitation can see all audits shared with them, but can't create new ones
    const isInvitedUser = !!acceptedInvitation?.presentationId;

    return NextResponse.json(
      {
        success: true,
        message: "Audit fetch successfully",
        data: audits,
        isInvitedUser: isInvitedUser, // Flag to indicate if user is invited (and only has that one audit)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/*
{
  "title": "Employee Performance Review 2025",
  "categories": [
    {
      "name": "Technical Skills",
      "questions": [
        {
          "text": "How well do you understand system architecture?",
          "options": [
            { "text": "Expert", "points": 5 },
            { "text": "Advanced", "points": 4 },
            { "text": "Intermediate", "points": 3 },
            { "text": "Basic", "points": 2 },
            { "text": "Beginner", "points": 1 }
          ]
        },
        {
          "text": "How comfortable are you with debugging production issues?",
          "options": [
            { "text": "Very Comfortable", "points": 5 },
            { "text": "Comfortable", "points": 4 },
            { "text": "Moderate", "points": 3 },
            { "text": "Slightly Comfortable", "points": 2 },
            { "text": "Not Comfortable", "points": 1 }
          ]
        },
        {
          "text": "How effectively do you write clean and maintainable code?",
          "options": [
            { "text": "Always", "points": 5 },
            { "text": "Often", "points": 4 },
            { "text": "Sometimes", "points": 3 },
            { "text": "Rarely", "points": 2 },
            { "text": "Never", "points": 1 }
          ]
        },
        {
          "text": "How strong is your understanding of databases and queries?",
          "options": [
            { "text": "Excellent", "points": 5 },
            { "text": "Good", "points": 4 },
            { "text": "Average", "points": 3 },
            { "text": "Basic", "points": 2 },
            { "text": "Poor", "points": 1 }
          ]
        },
        {
          "text": "How well do you handle version control (Git, etc.)?",
          "options": [
            { "text": "Expert", "points": 5 },
            { "text": "Advanced", "points": 4 },
            { "text": "Intermediate", "points": 3 },
            { "text": "Basic", "points": 2 },
            { "text": "Beginner", "points": 1 }
          ]
        }
      ]
    },
    {
      "name": "Communication & Collaboration",
      "questions": [
        {
          "text": "Do you communicate ideas clearly during meetings?",
          "options": [
            { "text": "Always", "points": 5 },
            { "text": "Often", "points": 4 },
            { "text": "Sometimes", "points": 3 },
            { "text": "Rarely", "points": 2 },
            { "text": "Never", "points": 1 }
          ]
        },
        {
          "text": "How effectively do you collaborate with team members?",
          "options": [
            { "text": "Very Effectively", "points": 5 },
            { "text": "Effectively", "points": 4 },
            { "text": "Moderately", "points": 3 },
            { "text": "Slightly", "points": 2 },
            { "text": "Poorly", "points": 1 }
          ]
        },
        {
          "text": "How do you handle conflicts within the team?",
          "options": [
            { "text": "Resolve Professionally", "points": 5 },
            { "text": "Try to Resolve", "points": 4 },
            { "text": "Avoid Conflict", "points": 3 },
            { "text": "Ignore It", "points": 2 },
            { "text": "Escalate Immediately", "points": 1 }
          ]
        },
        {
          "text": "Do you provide constructive feedback to peers?",
          "options": [
            { "text": "Always", "points": 5 },
            { "text": "Often", "points": 4 },
            { "text": "Sometimes", "points": 3 },
            { "text": "Rarely", "points": 2 },
            { "text": "Never", "points": 1 }
          ]
        },
        {
          "text": "Do you listen actively when others speak?",
          "options": [
            { "text": "Always", "points": 5 },
            { "text": "Often", "points": 4 },
            { "text": "Sometimes", "points": 3 },
            { "text": "Rarely", "points": 2 },
            { "text": "Never", "points": 1 }
          ]
        }
      ]
    }
  ]
}
*/
