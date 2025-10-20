import React, { useState, useEffect } from 'react';
import { PhysicalItem, TMDbMovie } from '../types';
import { apiService } from '../services/api.service';
import SearchModal from './SearchModal';
import FormatSelector from './FormatSelector';

interface MediaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: PhysicalItem | null;
}

interface MovieWithFormats {
  movie: TMDbMovie;
  formats: string[];
  details: any;
}

const MediaForm: React.FC<MediaFormProps> = ({ isOpen, onClose, onSuccess, editItem }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<TMDbMovie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<MovieWithFormats[]>([]);
  const [movieDetails, setMovieDetails] = useState<Map<number, any>>(new Map());
  const [formData, setFormData] = useState({
    // Physical item fields
    name: '',
    edition_notes: '',
    custom_image_url: '',
    purchase_date: '',
  });

  useEffect(() => {
    if (editItem) {
      // Editing an existing physical item
      setFormData({
        // Physical item fields
        name: editItem.name,
        edition_notes: editItem.edition_notes || '',
        custom_image_url: editItem.custom_image_url || '',
        purchase_date: editItem.purchase_date || '',
      });
      
      // Convert existing media to MovieWithFormats format for display
      const moviesWithFormats: MovieWithFormats[] = editItem.media.map(m => ({
        movie: {
          id: m.tmdb_id || m.id,
          title: m.title,
          overview: m.synopsis || '',
          poster_path: null, // We'll use cover_art_url directly
          release_date: m.release_date || '',
          vote_average: 0,
          vote_count: 0,
        },
        formats: m.formats || ['Blu-ray'],
        details: {
          title: m.title,
          id: m.tmdb_id || m.id,
          poster_url: m.cover_art_url,
          cover_art_url: m.cover_art_url,
          overview: m.synopsis,
          synopsis: m.synopsis,
          release_date: m.release_date,
          director: m.director,
          cast: m.cast,
        }
      }));
      setSelectedMovies(moviesWithFormats);
      
      // Store full details for each movie
      const details = new Map();
      editItem.media.forEach(m => {
        details.set(m.tmdb_id || m.id, {
          title: m.title,
          id: m.tmdb_id || m.id,
          poster_url: m.cover_art_url,
          cover_art_url: m.cover_art_url,
          overview: m.synopsis,
          synopsis: m.synopsis,
          release_date: m.release_date,
          director: m.director,
          cast: m.cast,
        });
      });
      setMovieDetails(details);
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        edition_notes: '',
        custom_image_url: '',
        purchase_date: '',
      });
      setSelectedMovies([]);
      setMovieDetails(new Map());
    }
  }, [editItem, isOpen]);

  const handleMovieSelected = async (movie: TMDbMovie) => {
    setShowSearch(false);
    setPendingMovie(movie);
    setShowFormatSelector(true);
  };

  const handleFormatsSelected = async (formats: string[]) => {
    if (!pendingMovie) return;
    
    setShowFormatSelector(false);
    
    try {
      // Fetch details for the movie if not already cached
      let details = movieDetails.get(pendingMovie.id);
      if (!details) {
        details = await apiService.getMovieDetails(pendingMovie.id);
        setMovieDetails(prev => new Map(prev).set(pendingMovie.id, details));
      }
      
      // Add movie with formats to selection
      const newMovieWithFormats: MovieWithFormats = {
        movie: pendingMovie,
        formats,
        details
      };
      
      setSelectedMovies(prev => [...prev, newMovieWithFormats]);
      
      // Auto-generate name if not manually set
      const allMovies = [...selectedMovies, newMovieWithFormats];
      const oldAutoName = updatePhysicalItemName(selectedMovies); // Compare to OLD
      const newAutoName = updatePhysicalItemName(allMovies);

      if (!formData.name || formData.name === oldAutoName) {
        setFormData({
          ...formData,
          name: newAutoName,
        });
      }
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
    } finally {
      setPendingMovie(null);
    }
  };

  const handleRemoveMovie = (movieId: number) => {
    const newMovies = selectedMovies.filter(m => m.movie.id !== movieId);
    const oldAutoName = updatePhysicalItemName(selectedMovies); // Compare to OLD
    const newAutoName = updatePhysicalItemName(newMovies);
    
    setSelectedMovies(newMovies);
    
    // Update name if it was auto-generated
    if (!formData.name || formData.name === oldAutoName) {
      setFormData({
        ...formData,
        name: newAutoName,
      });
    }
  };

  // Auto-update physical item name when movies change
  const updatePhysicalItemName = (movies: MovieWithFormats[]) => {
    if (movies.length === 0) return '';
    
    // Create name from movie titles
    const titles = movies.map(m => m.movie.title).join(' / ');
    
    if (movies.length === 1 && movies[0].formats.length === 1) {
      // Single movie with single format
      return `${titles} [${movies[0].formats[0]}]`;
    } else {
      // Multiple movies or multiple formats
      return `${titles} [Multi-format]`;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await apiService.uploadImage(file);
      setFormData({ ...formData, custom_image_url: result.url });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one movie is selected
    if (selectedMovies.length === 0) {
      alert('Please select at least one movie from TMDB.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Auto-generate name if not manually set
      const finalName = formData.name || updatePhysicalItemName(selectedMovies);

      if (editItem) {
        // Update existing physical item (physical fields only)
        await apiService.updatePhysicalItem(editItem.id, {
          name: finalName,
          edition_notes: formData.edition_notes,
          custom_image_url: formData.custom_image_url,
          purchase_date: formData.purchase_date,
        });
      } else {
        // Create new physical item with linked media
        const mediaArray = selectedMovies.map(movieWithFormats => {
          const { movie, formats, details } = movieWithFormats;
          return {
            title: details?.title || movie.title,
            tmdb_id: details?.id || movie.id,
            synopsis: details?.overview || details?.synopsis || movie.overview,
            cover_art_url: details?.poster_url || details?.cover_art_url || '',
            release_date: details?.release_date || movie.release_date,
            director: details?.director || '',
            cast: details?.cast || [],
            formats: formats,
          };
        });

        await apiService.createPhysicalItem({
          name: finalName,
          edition_notes: formData.edition_notes,
          custom_image_url: formData.custom_image_url,
          purchase_date: formData.purchase_date,
          media: mediaArray,
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save physical item:', error);
      alert('Failed to save physical item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get image URL - prioritize custom, then first selected movie's poster
  const imageUrl = formData.custom_image_url || 
    (selectedMovies.length > 0 ? selectedMovies[0].details?.poster_url : null);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editItem ? 'Edit Physical Item' : 'Add New Media'}
                </h2>
                <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Image */}
                <div>
                  <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                    {imageUrl ? (
                      <img src={imageUrl} alt={formData.name || "Physical item cover"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {!editItem && (
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="btn-primary w-full mb-4"
                    >
                      Choose a Movie
                    </button>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Custom Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-900 file:text-primary-700 dark:file:text-primary-200 hover:file:bg-primary-100 dark:hover:file:bg-primary-800"
                    />
                    {uploadingImage && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>}
                  </div>
                </div>

                {/* Right Column - Form Fields */}
                <div className="space-y-4">
                  {/* Selected Movies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Movies *
                    </label>
                    
                    {selectedMovies.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {selectedMovies.map((movieWithFormats) => (
                          <div
                            key={movieWithFormats.movie.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {movieWithFormats.movie.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {movieWithFormats.movie.release_date ? new Date(movieWithFormats.movie.release_date).getFullYear() : 'N/A'}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {movieWithFormats.formats.map((format) => (
                                    <span
                                      key={format}
                                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                    >
                                      {format}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {!editItem && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMovie(movieWithFormats.movie.id)}
                                  className="ml-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        No movies selected. Click "Choose a Movie" to add movies.
                      </p>
                    )}
                  </div>


                  {/* Physical Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || updatePhysicalItemName(selectedMovies)}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={updatePhysicalItemName(selectedMovies)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Auto-generated from movie titles and formats. Customize if needed.
                    </p>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Edition Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Edition Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Steelbook, Collector's Edition, 3D"
                      value={formData.edition_notes}
                      onChange={(e) => setFormData({ ...formData, edition_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editItem ? 'Update' : 'Add Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={handleMovieSelected}
      />

      {/* Format Selector Modal */}
      <FormatSelector
        isOpen={showFormatSelector}
        onClose={() => {
          setShowFormatSelector(false);
          setPendingMovie(null);
        }}
        onConfirm={handleFormatsSelected}
        movieTitle={pendingMovie?.title || ''}
      />
    </>
  );
};

export default MediaForm;

