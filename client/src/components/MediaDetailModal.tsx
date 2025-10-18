import React from 'react';
import { Media } from '../types';

interface MediaDetailModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ media, isOpen, onClose }) => {
  if (!isOpen || !media) return null;

  const imageUrl = media.custom_image_url || media.cover_art_url;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Image */}
            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{media.title}</h2>
              
              {media.release_date && (
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  {new Date(media.release_date).getFullYear()}
                </p>
              )}

              <div className="space-y-4 mb-6">
                {/* Physical Format */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Format</h3>
                  <span className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
                    {media.physical_format}
                  </span>
                </div>

                {/* Edition Notes */}
                {media.edition_notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Edition</h3>
                    <p className="text-gray-900 dark:text-gray-100">{media.edition_notes}</p>
                  </div>
                )}

                {/* Region Code */}
                {media.region_code && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Region Code</h3>
                    <p className="text-gray-900 dark:text-gray-100">{media.region_code}</p>
                  </div>
                )}

                {/* Director */}
                {media.director && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Director</h3>
                    <p className="text-gray-900 dark:text-gray-100">{media.director}</p>
                  </div>
                )}

                {/* Cast */}
                {media.cast && media.cast.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cast</h3>
                    <p className="text-gray-900 dark:text-gray-100">{media.cast.join(', ')}</p>
                  </div>
                )}

                {/* Synopsis */}
                {media.synopsis && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Synopsis</h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">{media.synopsis}</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <p>Added: {new Date(media.created_at || '').toLocaleDateString()}</p>
                {media.updated_at && media.updated_at !== media.created_at && (
                  <p>Updated: {new Date(media.updated_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailModal;

