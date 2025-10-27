import React, { useState, useEffect } from 'react';
import { Media, SortField, SortOrder } from '../types';
import { apiService } from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import MediaEditModal from '../components/MediaEditModal';

const MoviesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Media | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search query to prevent API calls on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMovies();
    }
  }, [isAuthenticated, sortBy, sortOrder, debouncedSearchQuery]);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getMedia({
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearchQuery || undefined,
      });
      setMovies(data);
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (newSortBy: SortField) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleEditMovie = (movie: Media) => {
    setSelectedMovie(movie);
    setShowEditModal(true);
  };

  const handleSaveMovie = (updatedMovie: Media) => {
    setMovies(prev => prev.map(m => m.id === updatedMovie.id ? updatedMovie : m));
    setShowEditModal(false);
    setSelectedMovie(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedMovie(null);
  };

  const handleDeleteMovie = async (movie: Media) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${movie.title}"?\n\nThis will remove the movie from your collection and from any physical items it's linked to. This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await apiService.deleteMedia(movie.id);
      setMovies(prev => prev.filter(m => m.id !== movie.id));
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Failed to delete movie. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You need to be logged in to access the movies management page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading movies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Movies Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {movies.length} {movies.length === 1 ? 'movie' : 'movies'} in your collection
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
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
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSortChange('title')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'title'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('director_last_name')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'director_last_name'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Director {sortBy === 'director_last_name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('release_date')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'release_date'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Year {sortBy === 'release_date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('created_at')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                sortBy === 'created_at'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Added {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm rounded-l-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-r-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Movies Grid/List */}
      {movies.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8M7 4v16a1 1 0 001 1h8a1 1 0 001-1V4M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h2V4z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Movies Found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {searchQuery 
              ? 'No movies match your search. Try adjusting your search terms.' 
              : 'No movies have been added to your collection yet.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
          : 'space-y-4'
        }>
          {movies.map((movie) => (
            <div
              key={movie.id}
              className={`card hover:shadow-lg transition-shadow relative group ${
                viewMode === 'list' ? 'flex items-center space-x-4' : ''
              }`}
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMovie(movie);
                }}
                className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all duration-200"
                title="Delete movie"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div 
                className="cursor-pointer"
                onClick={() => handleEditMovie(movie)}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="aspect-[2/3] mb-4">
                    {movie.cover_art_url ? (
                      <img
                        src={movie.cover_art_url}
                        alt={movie.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8M7 4v16a1 1 0 001 1h8a1 1 0 001-1V4M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h2V4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                    {movie.title}
                  </h3>
                  {movie.director && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {movie.director}
                    </p>
                  )}
                  {movie.release_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="w-16 h-24 flex-shrink-0">
                    {movie.cover_art_url ? (
                      <img
                        src={movie.cover_art_url}
                        alt={movie.title}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8M7 4v16a1 1 0 001 1h8a1 1 0 001-1V4M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h2V4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {movie.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      {movie.director && <span>{movie.director}</span>}
                      {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                      {movie.series && movie.series.length > 0 && (
                        <span className="text-primary-600 dark:text-primary-400">
                          {movie.series.map(s => s.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <MediaEditModal
        media={selectedMovie}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveMovie}
      />
    </div>
  );
};

export default MoviesPage;

