/**
 * Patient Reference Image Service
 * Business logic for managing multiple reference images per patient
 */

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  patientReferenceImagesSchema,
  usersSchema,
  type PatientReferenceImage,
} from '@/models/Schema';

/**
 * Get all reference images for a patient (excluding soft-deleted)
 */
export async function getPatientReferenceImages(
  patientId: string,
): Promise<PatientReferenceImage[]> {
  const images = await db
    .select()
    .from(patientReferenceImagesSchema)
    .where(
      and(
        eq(patientReferenceImagesSchema.patientId, patientId),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .orderBy(
      desc(patientReferenceImagesSchema.isPrimary),
      desc(patientReferenceImagesSchema.createdAt),
    );

  return images;
}

/**
 * Get primary reference image for a patient
 */
export async function getPrimaryReferenceImage(
  patientId: string,
): Promise<PatientReferenceImage | null> {
  const [image] = await db
    .select()
    .from(patientReferenceImagesSchema)
    .where(
      and(
        eq(patientReferenceImagesSchema.patientId, patientId),
        eq(patientReferenceImagesSchema.isPrimary, true),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .limit(1);

  return image || null;
}

/**
 * Add a new reference image for a patient
 */
export async function addReferenceImage(params: {
  patientId: string;
  imageUrl: string;
  label?: string;
  uploadedBy: string;
  isPrimary?: boolean;
}): Promise<PatientReferenceImage> {
  // If this is set as primary, unset any existing primary image
  if (params.isPrimary) {
    await db
      .update(patientReferenceImagesSchema)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(
        and(
          eq(patientReferenceImagesSchema.patientId, params.patientId),
          eq(patientReferenceImagesSchema.isPrimary, true),
          isNull(patientReferenceImagesSchema.deletedAt),
        ),
      );
  }

  // Insert new reference image
  const [newImage] = await db
    .insert(patientReferenceImagesSchema)
    .values({
      patientId: params.patientId,
      imageUrl: params.imageUrl,
      label: params.label || null,
      uploadedBy: params.uploadedBy,
      isPrimary: params.isPrimary || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!newImage) {
    throw new Error('Failed to create reference image');
  }

  // If this is the primary image, update the user's referenceImageUrl for backward compatibility
  if (params.isPrimary) {
    await db
      .update(usersSchema)
      .set({
        referenceImageUrl: params.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(usersSchema.id, params.patientId));
  }

  return newImage;
}

/**
 * Set a reference image as primary
 */
export async function setPrimaryReferenceImage(
  imageId: string,
  patientId: string,
): Promise<PatientReferenceImage> {
  // First, unset any existing primary image for this patient
  await db
    .update(patientReferenceImagesSchema)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(
      and(
        eq(patientReferenceImagesSchema.patientId, patientId),
        eq(patientReferenceImagesSchema.isPrimary, true),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    );

  // Set this image as primary
  const [updatedImage] = await db
    .update(patientReferenceImagesSchema)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(
      and(
        eq(patientReferenceImagesSchema.id, imageId),
        eq(patientReferenceImagesSchema.patientId, patientId),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .returning();

  if (!updatedImage) {
    throw new Error('Reference image not found or already deleted');
  }

  // Update the user's referenceImageUrl for backward compatibility
  await db
    .update(usersSchema)
    .set({
      referenceImageUrl: updatedImage.imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(usersSchema.id, patientId));

  return updatedImage;
}

/**
 * Update reference image label
 */
export async function updateReferenceImageLabel(
  imageId: string,
  patientId: string,
  label: string,
): Promise<PatientReferenceImage> {
  const [updatedImage] = await db
    .update(patientReferenceImagesSchema)
    .set({ label, updatedAt: new Date() })
    .where(
      and(
        eq(patientReferenceImagesSchema.id, imageId),
        eq(patientReferenceImagesSchema.patientId, patientId),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .returning();

  if (!updatedImage) {
    throw new Error('Reference image not found or already deleted');
  }

  return updatedImage;
}

/**
 * Soft delete a reference image
 */
export async function deleteReferenceImage(
  imageId: string,
  patientId: string,
): Promise<void> {
  // Get the image to check if it's primary
  const [image] = await db
    .select()
    .from(patientReferenceImagesSchema)
    .where(
      and(
        eq(patientReferenceImagesSchema.id, imageId),
        eq(patientReferenceImagesSchema.patientId, patientId),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .limit(1);

  if (!image) {
    throw new Error('Reference image not found or already deleted');
  }

  // Soft delete the image
  await db
    .update(patientReferenceImagesSchema)
    .set({ deletedAt: new Date() })
    .where(eq(patientReferenceImagesSchema.id, imageId));

  // If this was the primary image, update user's referenceImageUrl
  if (image.isPrimary) {
    // Try to find another image to set as primary
    const [nextImage] = await db
      .select()
      .from(patientReferenceImagesSchema)
      .where(
        and(
          eq(patientReferenceImagesSchema.patientId, patientId),
          isNull(patientReferenceImagesSchema.deletedAt),
        ),
      )
      .orderBy(desc(patientReferenceImagesSchema.createdAt))
      .limit(1);

    if (nextImage) {
      // Set the next most recent image as primary
      await db
        .update(patientReferenceImagesSchema)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(patientReferenceImagesSchema.id, nextImage.id));

      // Update user's referenceImageUrl
      await db
        .update(usersSchema)
        .set({
          referenceImageUrl: nextImage.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(usersSchema.id, patientId));
    } else {
      // No more images, clear the user's referenceImageUrl
      await db
        .update(usersSchema)
        .set({
          referenceImageUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(usersSchema.id, patientId));
    }
  }
}

/**
 * Check if patient has any reference images
 */
export async function hasReferenceImages(patientId: string): Promise<boolean> {
  const [count] = await db
    .select({ count: patientReferenceImagesSchema.id })
    .from(patientReferenceImagesSchema)
    .where(
      and(
        eq(patientReferenceImagesSchema.patientId, patientId),
        isNull(patientReferenceImagesSchema.deletedAt),
      ),
    )
    .limit(1);

  return !!count;
}
