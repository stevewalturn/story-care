/**
 * Organization Creation API
 * Creates a new organization with the first org admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { organizationsSchema, users } from '@/models/Schema';
import { generateJoinCode } from '@/services/OrganizationService';

// Validation schema for organization creation
const createOrganizationSchema = z.object({
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  email: z.string().email('Invalid email address'),
  adminName: z.string().min(1, 'Admin name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  contactEmail: z.string().email('Invalid contact email'),
});

/**
 * POST /api/auth/signup - Create new organization with org admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrganizationSchema.parse(body);

    // Check if Firebase UID already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.firebaseUid, validated.firebaseUid),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingEmail = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validated.email),
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 },
      );
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    let isUnique = false;

    while (!isUnique) {
      const existing = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.joinCode, joinCode),
      });

      if (!existing) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    // Generate slug from organization name
    const slug = validated.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Default organization settings
    const defaultSettings = {
      subscriptionTier: 'basic',
      features: {
        maxTherapists: 5,
        maxPatients: 50,
        aiCreditsPerMonth: 1000,
        storageGB: 10,
      },
      defaults: {
        reflectionQuestions: [],
        surveyTemplate: null,
        sessionTranscriptionEnabled: true,
      },
      branding: {
        welcomeMessage: null,
        supportEmail: validated.contactEmail,
      },
    };

    // Create organization
    const [organization] = await db
      .insert(organizationsSchema)
      .values({
        name: validated.organizationName,
        slug,
        contactEmail: validated.contactEmail,
        logoUrl: null,
        primaryColor: null,
        joinCode,
        joinCodeEnabled: true,
        settings: defaultSettings,
        status: 'active',
        createdBy: null, // Will be updated after admin is created
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!organization) {
      throw new Error('Failed to create organization');
    }

    // Create org admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        firebaseUid: validated.firebaseUid,
        email: validated.email,
        name: validated.adminName,
        role: 'org_admin',
        organizationId: organization.id,
        status: 'active', // Immediately active since they're creating the org
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!adminUser) {
      // Rollback: delete the organization
      await db.delete(organizationsSchema).where((o, { eq }) => eq(o.id, organization.id));
      throw new Error('Failed to create admin user');
    }

    // Update organization with createdBy
    await db
      .update(organizationsSchema)
      .set({ createdBy: adminUser.id, updatedAt: new Date() })
      .where((o, { eq }) => eq(o.id, organization.id));

    return NextResponse.json(
      {
        success: true,
        organizationId: organization.id,
        userId: adminUser.id,
        joinCode: organization.joinCode,
        message: 'Organization created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 },
      );
    }

    console.error('Organization creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 },
    );
  }
}
