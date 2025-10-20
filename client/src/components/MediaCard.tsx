import React from 'react';
import { PhysicalItem } from '../types';

interface MediaCardProps {
  physicalItem: PhysicalItem;
  onClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ physicalItem, onClick }) => {
  // Get primary media for display
  const primaryMedia = physicalItem.media[0];
  const imageUrl = physicalItem.custom_image_url || primaryMedia?.cover_art_url;
  const formatColors: Record<string, string> = {
    '4K UHD': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Blu-ray': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'DVD': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'LaserDisc': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'VHS': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const getFormatColor = (format: string) => formatColors[format] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

  return (
    <div
      className="card cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden p-0"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={physicalItem.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
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
        
        {/* Format Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {physicalItem.physical_format.map((format, idx) => (
            <span key={idx} className={`${getFormatColor(format)} text-xs font-medium px-2 py-1 rounded shadow-sm`}>
              {format}
            </span>
          ))}
        </div>
        
        {/* Multi-disc indicator */}
        {physicalItem.media.length > 1 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-black bg-opacity-75 text-white text-xs font-medium px-2 py-1 rounded">
              {physicalItem.media.length} movies
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
          {primaryMedia?.title || physicalItem.name}
        </h3>
        {primaryMedia?.release_date && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(primaryMedia.release_date).getFullYear()}
          </p>
        )}
        {primaryMedia?.series && primaryMedia.series.length > 0 && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 line-clamp-1">
            {primaryMedia.series.map(s => s.name).join(', ')}
          </p>
        )}
        {physicalItem.edition_notes && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic line-clamp-1">{physicalItem.edition_notes}</p>
        )}
      </div>
    </div>
  );
};

export default MediaCard;

