import React from 'react';
import { PhysicalItem } from '../types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  physicalItems: PhysicalItem[];
  onItemClick: (item: PhysicalItem) => void;
  isEditMode?: boolean;
  isAuthenticated?: boolean;
  onEditItem?: (item: PhysicalItem) => void;
  onDeleteItem?: (itemId: number) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ 
  physicalItems, 
  onItemClick, 
  isEditMode = false, 
  isAuthenticated = false,
  onEditItem,
  onDeleteItem
}) => {
  if (physicalItems.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M7 3v18"/>
            <path d="M3 7.5h4"/>
            <path d="M3 12h18"/>
            <path d="M3 16.5h4"/>
            <path d="M17 3v18"/>
            <path d="M17 7.5h4"/>
            <path d="M17 16.5h4"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Items Found</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Try adjusting your filters or add new items to your collection
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {physicalItems.map((item) => (
        <MediaCard 
          key={item.id} 
          physicalItem={item} 
          onClick={() => onItemClick(item)}
          isEditMode={isEditMode}
          isAuthenticated={isAuthenticated}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
};

export default MediaGrid;

