import React from 'react';
import { Media } from '../types';

interface MediaCardProps {
  media: Media;
  onClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ media, onClick }) => {
  const imageUrl = media.custom_image_url || media.cover_art_url;
  const formatColors: Record<string, string> = {
    '4K UHD': 'bg-blue-100 text-blue-800',
    'Blu-ray': 'bg-green-100 text-green-800',
    'DVD': 'bg-orange-100 text-orange-800',
  };

  const formatColor = formatColors[media.physical_format] || 'bg-gray-100 text-gray-800';

  return (
    <div
      className="card cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden p-0"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] bg-gray-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={media.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18"
              />
            </svg>
          </div>
        )}
        
        {/* Format Badge */}
        <div className="absolute top-2 right-2">
          <span className={`${formatColor} text-xs font-medium px-2 py-1 rounded`}>
            {media.physical_format}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{media.title}</h3>
        {media.release_date && (
          <p className="text-sm text-gray-500">
            {new Date(media.release_date).getFullYear()}
          </p>
        )}
        {media.edition_notes && (
          <p className="text-xs text-gray-600 mt-2 italic line-clamp-1">{media.edition_notes}</p>
        )}
      </div>
    </div>
  );
};

export default MediaCard;

