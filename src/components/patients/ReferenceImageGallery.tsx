'use client';

import type { PatientReferenceImage } from '@/models/Schema';
import { Edit2, Image as ImageIcon, Star, StarOff, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type ReferenceImageGalleryProps = {
  patientId: string;
  onImageAdded?: () => void;
  showActions?: boolean; // Show edit/delete actions
  maxImages?: number; // Max visible images (optional)
};

export function ReferenceImageGallery({
  patientId,
  onImageAdded,
  showActions = true,
  maxImages,
}: ReferenceImageGalleryProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<PatientReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  // Fetch reference images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`/api/patients/${patientId}/reference-images`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reference images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching reference images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [patientId]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);

      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', images.length === 0 ? 'true' : 'false'); // First image is primary

      const response = await fetch(`/api/patients/${patientId}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      // Refresh images list
      await fetchImages();
      onImageAdded?.();
      setShowUploadOptions(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Handle selecting from media library (placeholder for future implementation)
  // const handleSelectFromLibrary = async (imageUrl: string, label?: string) => {
  //   ... implementation
  // };

  // Set as primary
  const handleSetPrimary = async (imageId: string) => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/patients/${patientId}/reference-images/${imageId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'set_primary' }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      alert(error instanceof Error ? error.message : 'Failed to set primary image');
    }
  };

  // Update label
  const handleUpdateLabel = async (imageId: string) => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/patients/${patientId}/reference-images/${imageId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'update_label', label: labelValue }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update label');
      }

      await fetchImages();
      setEditingLabel(null);
      setLabelValue('');
    } catch (error) {
      console.error('Error updating label:', error);
      alert(error instanceof Error ? error.message : 'Failed to update label');
    }
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this reference image?')) {
      return;
    }

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/patients/${patientId}/reference-images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  // Get signed URL for image display
  const getImageUrl = (gcsPath: string) => {
    // If it's already a URL, return it
    if (gcsPath.startsWith('http')) {
      return gcsPath;
    }
    // Otherwise, fetch signed URL (you may need to implement this endpoint)
    return `/api/media/signed-url?path=${encodeURIComponent(gcsPath)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading reference images...</div>
      </div>
    );
  }

  const displayImages = maxImages ? images.slice(0, maxImages) : images;
  const remainingCount = maxImages && images.length > maxImages ? images.length - maxImages : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Reference Images (
          {images.length}
          )
        </h3>
        {showActions && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
          >
            <Upload className="mr-2 size-4" />
            Add Image
          </Button>
        )}
      </div>

      {/* Upload Options */}
      {showUploadOptions && (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button type="button" variant="secondary" size="sm" className="w-full" disabled={uploading}>
                <Upload className="mr-2 size-4" />
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <div className="text-center text-xs text-gray-500">or</div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => {
              // TODO: Open media library selector modal
              alert('Media library selector coming soon!');
            }}
          >
            <ImageIcon className="mr-2 size-4" />
            Select from Media Library
          </Button>
        </div>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <ImageIcon className="mb-2 size-12 text-gray-400" />
          <p className="text-sm text-gray-600">No reference images yet</p>
          <p className="text-xs text-gray-500">
            Add images to maintain consistent patient appearance in AI generations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {displayImages.map(image => (
            <div key={image.id} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={getImageUrl(image.imageUrl)}
                  alt={image.label || 'Reference image'}
                  className="size-full object-cover"
                />
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 rounded-full bg-yellow-400 p-1.5">
                    <Star className="size-3 fill-white text-white" />
                  </div>
                )}
                {showActions && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="rounded-full bg-white p-2 hover:bg-gray-100"
                        title="Set as primary"
                      >
                        <StarOff className="size-4 text-gray-700" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLabel(image.id);
                        setLabelValue(image.label || '');
                      }}
                      className="rounded-full bg-white p-2 hover:bg-gray-100"
                      title="Edit label"
                    >
                      <Edit2 className="size-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="rounded-full bg-white p-2 hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              {editingLabel === image.id ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={labelValue}
                    onChange={e => setLabelValue(e.target.value)}
                    placeholder="Label"
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdateLabel(image.id)}
                    className="px-2"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="mt-2 truncate text-xs text-gray-600">
                  {image.label || 'Untitled'}
                </p>
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
              <p className="text-sm font-medium text-gray-600">
                +
                {remainingCount}
                {' '}
                more
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
