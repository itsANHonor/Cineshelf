import React, { useState, useEffect } from 'react';
import { Media, CreateMediaDto, TMDbMovie } from '../types';
import { apiService } from '../services/api.service';
import SearchModal from './SearchModal';

interface MediaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMedia?: Media | null;
}

const MediaForm: React.FC<MediaFormProps> = ({ isOpen, onClose, onSuccess, editMedia }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<CreateMediaDto>({
    title: '',
    tmdb_id: undefined,
    synopsis: '',
    cover_art_url: '',
    release_date: '',
    director: '',
    cast: [],
    physical_format: 'Blu-ray',
    edition_notes: '',
    region_code: '',
    custom_image_url: '',
  });

  useEffect(() => {
    if (editMedia) {
      setFormData({
        title: editMedia.title,
        tmdb_id: editMedia.tmdb_id,
        synopsis: editMedia.synopsis || '',
        cover_art_url: editMedia.cover_art_url || '',
        release_date: editMedia.release_date || '',
        director: editMedia.director || '',
        cast: editMedia.cast || [],
        physical_format: editMedia.physical_format,
        edition_notes: editMedia.edition_notes || '',
        region_code: editMedia.region_code || '',
        custom_image_url: editMedia.custom_image_url || '',
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        tmdb_id: undefined,
        synopsis: '',
        cover_art_url: '',
        release_date: '',
        director: '',
        cast: [],
        physical_format: 'Blu-ray',
        edition_notes: '',
        region_code: '',
        custom_image_url: '',
      });
    }
  }, [editMedia, isOpen]);

  const handleTMDbSelect = async (movie: TMDbMovie) => {
    setShowSearch(false);
    
    try {
      const details = await apiService.getMovieDetails(movie.id);
      setFormData({
        ...formData,
        title: details.title,
        tmdb_id: details.id,
        synopsis: details.overview,
        cover_art_url: details.poster_url || '',
        release_date: details.release_date,
        director: details.director || '',
        cast: details.cast || [],
      });
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await apiService.uploadImage(file);
      setFormData({ ...formData, custom_image_url: result.url });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editMedia) {
        await apiService.updateMedia(editMedia.id, formData);
      } else {
        await apiService.createMedia(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save media:', error);
      alert('Failed to save media. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const imageUrl = formData.custom_image_url || formData.cover_art_url;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editMedia ? 'Edit Media' : 'Add New Media'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Image */}
                <div>
                  <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden mb-4">
                    {imageUrl ? (
                      <img src={imageUrl} alt={formData.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {!editMedia && (
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="btn-primary w-full mb-4"
                    >
                      Search TMDb
                    </button>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Custom Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {uploadingImage && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                  </div>
                </div>

                {/* Right Column - Form Fields */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Physical Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Physical Format *
                    </label>
                    <select
                      required
                      value={formData.physical_format}
                      onChange={(e) => setFormData({ ...formData, physical_format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="4K UHD">4K UHD</option>
                      <option value="Blu-ray">Blu-ray</option>
                      <option value="DVD">DVD</option>
                    </select>
                  </div>

                  {/* Release Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.release_date}
                      onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Edition Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edition Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Steelbook, Collector's Edition"
                      value={formData.edition_notes}
                      onChange={(e) => setFormData({ ...formData, edition_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Region Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Region A, Region 1"
                      value={formData.region_code}
                      onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Director */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={formData.director}
                      onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Synopsis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Synopsis
                    </label>
                    <textarea
                      rows={4}
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editMedia ? 'Update' : 'Add Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleTMDbSelect}
      />
    </>
  );
};

export default MediaForm;

