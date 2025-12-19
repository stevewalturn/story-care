-- Create patient_reference_images table for multiple reference images per patient
CREATE TABLE patient_reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Patient reference
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Image details
  image_url TEXT NOT NULL,
  label VARCHAR(255),

  -- Primary indicator
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Upload tracking
  uploaded_by UUID NOT NULL REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Soft delete for HIPAA compliance
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_patient_reference_images_patient_id ON patient_reference_images(patient_id);
CREATE INDEX idx_patient_reference_images_uploaded_by ON patient_reference_images(uploaded_by);
CREATE INDEX idx_patient_reference_images_is_primary ON patient_reference_images(is_primary);
CREATE INDEX idx_patient_reference_images_created_at ON patient_reference_images(created_at);
CREATE INDEX idx_patient_reference_images_deleted_at ON patient_reference_images(deleted_at);

-- Create a partial unique index to ensure only one primary image per patient
CREATE UNIQUE INDEX idx_patient_reference_images_one_primary_per_patient
  ON patient_reference_images(patient_id)
  WHERE is_primary = true AND deleted_at IS NULL;
