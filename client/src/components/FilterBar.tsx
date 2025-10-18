import React from 'react';
import { PhysicalFormat, SortField, SortOrder } from '../types';

interface FilterBarProps {
  format: PhysicalFormat;
  sortBy: SortField;
  sortOrder: SortOrder;
  onFormatChange: (format: PhysicalFormat) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  format,
  sortBy,
  sortOrder,
  onFormatChange,
  onSortChange,
}) => {
  const handleSortByChange = (newSortBy: SortField) => {
    if (newSortBy === sortBy) {
      // Toggle sort order
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(newSortBy, 'desc');
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Format Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Format:</label>
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as PhysicalFormat)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Formats</option>
            <option value="4K UHD">4K UHD</option>
            <option value="Blu-ray">Blu-ray</option>
            <option value="DVD">DVD</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleSortByChange('title')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'title'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('release_date')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'release_date'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year {sortBy === 'release_date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortByChange('created_at')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'created_at'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Added {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

