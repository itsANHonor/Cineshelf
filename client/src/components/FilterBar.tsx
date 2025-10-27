import React from 'react';
import { PhysicalFormat, SortField, SortOrder } from '../types';
import ThemeToggle from './ThemeToggle';

interface FilterBarProps {
  format: PhysicalFormat;
  sortBy: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  onFormatChange: (format: PhysicalFormat) => void;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  format,
  sortBy,
  sortOrder,
  searchQuery,
  onFormatChange,
  onSortChange,
  onSearchChange,
  onClearFilters,
}) => {
  const handleSortByChange = (newSortBy: SortField) => {
    if (newSortBy === sortBy) {
      // Toggle sort order
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for alphabetical sorts, descending for others
      const defaultOrder = ['title', 'series_sort', 'director_last_name'].includes(newSortBy) ? 'asc' : 'desc';
      onSortChange(newSortBy, defaultOrder);
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value as PhysicalFormat)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Formats</option>
              <option value="4K UHD">4K UHD</option>
              <option value="Blu-ray">Blu-ray</option>
              <option value="DVD">DVD</option>
              <option value="LaserDisc">LaserDisc</option>
              <option value="VHS">VHS</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSortByChange('title')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'title'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortByChange('series_sort')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'series_sort'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Series {sortBy === 'series_sort' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortByChange('director_last_name')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'director_last_name'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Director {sortBy === 'director_last_name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortByChange('release_date')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'release_date'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Year {sortBy === 'release_date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortByChange('created_at')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'created_at'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Added {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters & Theme Toggle */}
        <div className="flex items-center gap-4">
          {(searchQuery || format !== 'all') && (
            <button
              onClick={onClearFilters}
              className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Clear Filters
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

