import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Media, PhysicalFormat, SortField, SortOrder } from '../types';
import { apiService } from '../services/api.service';
import MediaGrid from '../components/MediaGrid';
import FilterBar from '../components/FilterBar';
import MediaDetailModal from '../components/MediaDetailModal';

const CollectionPage: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  
  // Filter state
  const [format, setFormat] = useState<PhysicalFormat>('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadData();
  }, [format, sortBy, sortOrder]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load media with filters
      const mediaData = await apiService.getMedia({
        format: format !== 'all' ? format : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setMedia(mediaData);
    } catch (error) {
      console.error('Failed to load collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (newSortBy: SortField, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Collection</h1>
          <p className="text-gray-600">
            {media.length} {media.length === 1 ? 'item' : 'items'} in your library
          </p>
        </div>
        <Link to="/" className="btn-secondary">
          ← Back to Home
        </Link>
      </div>

      {media.length > 0 && (
        <FilterBar
          format={format}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFormatChange={setFormat}
          onSortChange={handleSortChange}
        />
      )}

      {/* Media Grid or Empty State */}
      {media.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Media Found</h3>
          <p className="text-gray-600 mb-6">
            {format !== 'all' 
              ? 'No items match the selected filter. Try changing your filter settings.' 
              : 'Start building your collection by adding your first movie or TV show'}
          </p>
          <Link to="/admin" className="btn-primary">
            Add Your First Item
          </Link>
        </div>
      ) : (
        <MediaGrid media={media} onMediaClick={setSelectedMedia} />
      )}

      {/* Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
};

export default CollectionPage;
