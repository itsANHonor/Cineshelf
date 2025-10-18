import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

interface CollectionImportModalProps {
  tmdbId: number;
  onClose: () => void;
  onImport: (collectionId: number, collectionName: string, sortName: string) => void;
}

const CollectionImportModal: React.FC<CollectionImportModalProps> = ({ tmdbId, onClose, onImport }) => {
  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection();
  }, [tmdbId]);

  const loadCollection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const collectionData = await apiService.getTMDbCollections(tmdbId);
      if (collectionData) {
        setCollection(collectionData);
      } else {
        setError('This movie does not belong to any collection.');
      }
    } catch (err) {
      console.error('Failed to load collection:', err);
      setError('Failed to load collection data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (collection) {
      onImport(collection.id, collection.name, collection.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import TMDb Collection</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading collection...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button onClick={onClose} className="mt-4 btn-secondary">
                Close
              </button>
            </div>
          )}

          {!isLoading && !error && collection && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{collection.name}</h3>
                {collection.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${collection.poster_path}`}
                    alt={collection.name}
                    className="rounded-lg mb-4 max-w-xs"
                  />
                )}
                {collection.overview && (
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{collection.overview}</p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Importing this collection will create a new series called "{collection.name}" and associate this movie with it.
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={handleImport} className="btn-primary">
                  Import as Series
                </button>
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionImportModal;


