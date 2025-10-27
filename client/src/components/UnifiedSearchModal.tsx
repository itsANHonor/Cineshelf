import React, { useState, useEffect } from 'react';
import { TMDbMovie, Media, PhysicalItem } from '../types';
import { apiService } from '../services/api.service';
import FormatSelector from './FormatSelector';

interface UnifiedSearchResult {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  cover_art_url?: string | null;
  director?: string;
  source: 'database' | 'tmdb';
  tmdb_id?: number;
  originalData: Media | TMDbMovie;
}

interface UnifiedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: UnifiedSearchResult, formats: string[]) => void;
  currentPhysicalItem?: PhysicalItem | null;
}

const UnifiedSearchModal: React.FC<UnifiedSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  currentPhysicalItem 
}) => {
  const [query, setQuery] = useState('');
  const [databaseResults, setDatabaseResults] = useState<UnifiedSearchResult[]>([]);
  const [tmdbResults, setTmdbResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [selectedResult, setSelectedResult] = useState<UnifiedSearchResult | null>(null);
  const [allMovies, setAllMovies] = useState<Media[]>([]);

  // Get IDs of movies already linked to current physical item
  const linkedMovieIds = currentPhysicalItem?.media.map(m => m.id) || [];

  useEffect(() => {
    if (isOpen) {
      loadAllMovies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      setDatabaseResults([]);
      setTmdbResults([]);
      setHasSearched(false);
    }
  }, [query]);

  const loadAllMovies = async () => {
    try {
      const movies = await apiService.getMedia();
      setAllMovies(movies);
    } catch (error) {
      console.error('Failed to load movies:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search local database
      const filteredMovies = allMovies.filter(movie => {
        const matchesSearch = 
          movie.title.toLowerCase().includes(query.toLowerCase()) ||
          movie.director?.toLowerCase().includes(query.toLowerCase()) ||
          movie.synopsis?.toLowerCase().includes(query.toLowerCase());
        
        const notLinked = !linkedMovieIds.includes(movie.id);
        
        return matchesSearch && notLinked;
      });

      const databaseResults: UnifiedSearchResult[] = filteredMovies.map(movie => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.synopsis,
        cover_art_url: movie.cover_art_url,
        director: movie.director,
        source: 'database',
        tmdb_id: movie.tmdb_id,
        originalData: movie
      }));

      setDatabaseResults(databaseResults);

      // Search TMDB
      const tmdbResponse = await apiService.searchMovies(query);
      const tmdbResults: UnifiedSearchResult[] = tmdbResponse.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        release_date: movie.release_date,
        overview: movie.overview,
        poster_path: movie.poster_path,
        source: 'tmdb',
        tmdb_id: movie.id,
        originalData: movie
      }));

      setTmdbResults(tmdbResults);
    } catch (error) {
      console.error('Search failed:', error);
      setDatabaseResults([]);
      setTmdbResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: UnifiedSearchResult) => {
    setSelectedResult(result);
    setShowFormatSelector(true);
  };

  const handleFormatsSelected = (formats: string[]) => {
    if (selectedResult) {
      onSelect(selectedResult, formats);
    }
    setShowFormatSelector(false);
    setSelectedResult(null);
    setQuery('');
    setDatabaseResults([]);
    setTmdbResults([]);
    setHasSearched(false);
  };

  const handleClose = () => {
    setQuery('');
    setDatabaseResults([]);
    setTmdbResults([]);
    setHasSearched(false);
    setSelectedResult(null);
    onClose();
  };

  const getImageUrl = (result: UnifiedSearchResult) => {
    if (result.source === 'database' && result.cover_art_url) {
      return result.cover_art_url;
    } else if (result.source === 'tmdb' && result.poster_path) {
      return `https://image.tmdb.org/t/p/w500${result.poster_path}`;
    }
    return null;
  };

  const getReleaseYear = (releaseDate?: string) => {
    if (!releaseDate) return 'N/A';
    return new Date(releaseDate).getFullYear();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-start justify-center p-4 pt-20">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Movie</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Form */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for movies..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <svg
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isSearching && (
                  <div className="absolute right-3 top-3.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {!hasSearched && !isSearching && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Enter a movie title to search your collection and TMDB</p>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Searching...</p>
                </div>
              )}

              {hasSearched && !isSearching && databaseResults.length === 0 && tmdbResults.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No movies found for "{query}"</p>
                </div>
              )}

              {/* Database Results */}
              {databaseResults.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    In Your Collection ({databaseResults.length})
                  </h3>
                  <div className="space-y-3">
                    {databaseResults.map((result) => (
                      <div
                        key={`db-${result.id}`}
                        onClick={() => handleResultSelect(result)}
                        className="flex gap-4 p-4 rounded-lg cursor-pointer transition-colors border hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                      >
                        {/* Poster */}
                        <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {getImageUrl(result) ? (
                            <img
                              src={getImageUrl(result)!}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                {result.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getReleaseYear(result.release_date)} • {result.director || 'Unknown Director'}
                              </p>
                              {result.overview && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                  {result.overview}
                                </p>
                              )}
                            </div>
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                              Database
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TMDB Results */}
              {tmdbResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    From TMDB ({tmdbResults.length})
                  </h3>
                  <div className="space-y-3">
                    {tmdbResults.map((result) => (
                      <div
                        key={`tmdb-${result.id}`}
                        onClick={() => handleResultSelect(result)}
                        className="flex gap-4 p-4 rounded-lg cursor-pointer transition-colors border hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                      >
                        {/* Poster */}
                        <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {getImageUrl(result) ? (
                            <img
                              src={getImageUrl(result)!}
                              alt={result.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                {result.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getReleaseYear(result.release_date)}
                              </p>
                              {result.overview && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                  {result.overview}
                                </p>
                              )}
                            </div>
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              TMDB
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Format Selector Modal */}
      <FormatSelector
        isOpen={showFormatSelector}
        onClose={() => {
          setShowFormatSelector(false);
          setSelectedResult(null);
        }}
        onConfirm={handleFormatsSelected}
        movieTitle={selectedResult?.title || ''}
      />
    </>
  );
};

export default UnifiedSearchModal;

