import React, { useState, useEffect } from 'react';
import { Media, PhysicalFormat, SortField, SortOrder } from '../types';
import { apiService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import MediaGrid from '../components/MediaGrid';
import FilterBar from '../components/FilterBar';
import MediaDetailModal from '../components/MediaDetailModal';

const SESSION_SORT_BY_KEY = 'collection_sort_by';
const SESSION_SORT_ORDER_KEY = 'collection_sort_order';

const CollectionPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState('Media Collection');
  
  // Filter state
  const [format, setFormat] = useState<PhysicalFormat>('all');
  const [sortBy, setSortBy] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Initialize sort preferences and collection title
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        
        // Load collection title for all users
        setCollectionTitle(settings.collection_title || 'Media Collection');
        
        if (isAuthenticated) {
          // Admin user: use server-side default sort settings
          const adminSortBy = (settings.default_sort_by as SortField) || 'created_at';
          const adminSortOrder = (settings.default_sort_order as SortOrder) || 'desc';
          setSortBy(adminSortBy);
          setSortOrder(adminSortOrder);
        } else {
          // Public user: check session storage, default to title ascending
          const savedSortBy = sessionStorage.getItem(SESSION_SORT_BY_KEY) as SortField | null;
          const savedSortOrder = sessionStorage.getItem(SESSION_SORT_ORDER_KEY) as SortOrder | null;
          
          if (savedSortBy && savedSortOrder) {
            setSortBy(savedSortBy);
            setSortOrder(savedSortOrder);
          }
          // else: keep default 'title' and 'asc' from state initialization
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
      setIsInitialized(true);
    };

    initializeSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [format, sortBy, sortOrder, isInitialized]);

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
    
    // Save to session storage for public users
    if (!isAuthenticated) {
      sessionStorage.setItem(SESSION_SORT_BY_KEY, newSortBy);
      sessionStorage.setItem(SESSION_SORT_ORDER_KEY, newSortOrder);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading collection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{collectionTitle}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {media.length} {media.length === 1 ? 'item' : 'items'} in your library
        </p>
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Media Found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {format !== 'all' 
              ? 'No items match the selected filter. Try changing your filter settings.' 
              : 'Start building your collection by adding your first movie or TV show'}
          </p>
          <a href="/admin" className="btn-primary inline-block">
            Add Your First Item
          </a>
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
