import React, { useState, useEffect } from 'react';
import { PhysicalItem, TMDbMovie, Media, UnifiedSearchResult } from '../types';
import { apiService } from '../services/api.service';
import UnifiedSearchModal from './UnifiedSearchModal';
import StoreLinkManager from './StoreLinkManager';
import MediaEditModal from './MediaEditModal';
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
  mediaDbId?: number; // Track the actual database ID
}

const MediaForm: React.FC<MediaFormProps> = ({ isOpen, onClose, onSuccess, editItem }) => {
  const [showUnifiedSearch, setShowUnifiedSearch] = useState(false);
  const [showMediaEditModal, setShowMediaEditModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<MovieWithFormats[]>([]);
  const [movieDetails, setMovieDetails] = useState<Map<number, any>>(new Map());
  const [storeLinks, setStoreLinks] = useState<Array<{label: string; url: string}>>([]);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [editingFormatsFor, setEditingFormatsFor] = useState<number | null>(null);
  const [originalFormats, setOriginalFormats] = useState<string[]>([]);
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
        mediaDbId: m.id, // Preserve the actual media database ID
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
      
      // Load store links
      setStoreLinks(editItem.store_links || []);
      
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
      setStoreLinks([]);
    }
  }, [editItem, isOpen]);

  const handleUnifiedSearchSelect = async (result: UnifiedSearchResult, formats: string[]) => {
    try {
      if (result.source === 'database') {
        // Handle existing database movie
        const existingMedia = result.originalData as Media;
        
        // Add existing movie with formats to selection
        const newMovieWithFormats: MovieWithFormats = {
          movie: {
            id: existingMedia.tmdb_id || existingMedia.id,
            title: existingMedia.title,
            overview: existingMedia.synopsis || '',
            poster_path: null,
            release_date: existingMedia.release_date || '',
            vote_average: 0,
            vote_count: 0,
          },
          formats,
          details: {
            title: existingMedia.title,
            id: existingMedia.tmdb_id || existingMedia.id,
            poster_url: existingMedia.cover_art_url,
            cover_art_url: existingMedia.cover_art_url,
            overview: existingMedia.synopsis,
            synopsis: existingMedia.synopsis,
            release_date: existingMedia.release_date,
            director: existingMedia.director,
            cast: existingMedia.cast,
          }
        };
        
        setSelectedMovies(prev => [...prev, newMovieWithFormats]);
        
        // Auto-generate name if not manually set
        const allMovies = [...selectedMovies, newMovieWithFormats];
        const oldAutoName = updatePhysicalItemName(selectedMovies);
        const newAutoName = updatePhysicalItemName(allMovies);

        if (!formData.name || formData.name === oldAutoName) {
          setFormData({
            ...formData,
            name: newAutoName,
          });
        }
      } else {
        // Handle TMDB movie (existing flow)
        const tmdbMovie = result.originalData as TMDbMovie;
        
        // Fetch details for the movie if not already cached
        let details = movieDetails.get(tmdbMovie.id);
        if (!details) {
          details = await apiService.getMovieDetails(tmdbMovie.id);
          setMovieDetails(prev => new Map(prev).set(tmdbMovie.id, details));
        }
        
        // Add movie with formats to selection
        const newMovieWithFormats: MovieWithFormats = {
          movie: tmdbMovie,
          formats,
          details
        };
        
        setSelectedMovies(prev => [...prev, newMovieWithFormats]);
        
        // Auto-generate name if not manually set
        const allMovies = [...selectedMovies, newMovieWithFormats];
        const oldAutoName = updatePhysicalItemName(selectedMovies);
        const newAutoName = updatePhysicalItemName(allMovies);

        if (!formData.name || formData.name === oldAutoName) {
          setFormData({
            ...formData,
            name: newAutoName,
          });
        }
      }
    } catch (error) {
      console.error('Failed to add movie:', error);
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

  const handleRemoveMovieFromPhysicalItem = async (movieWithFormats: MovieWithFormats) => {
    if (!editItem) {
      // Creating new item - just remove from local state
      handleRemoveMovie(movieWithFormats.movie.id);
      return;
    }
    
    // Editing existing item - call API
    const confirmed = confirm(
      `Remove "${movieWithFormats.movie.title}" from this physical item?\n\n` +
      `The movie will remain in your database but won't be linked to this item.`
    );
    
    if (!confirmed) return;
    
    try {
      await apiService.removeMediaLink(editItem.id, movieWithFormats.mediaDbId!);
      setSelectedMovies(prev => prev.filter(m => m.mediaDbId !== movieWithFormats.mediaDbId));
      // Show success message
    } catch (error) {
      alert('Failed to remove movie. Please try again.');
    }
  };

  const handleEditMovie = (movieWithFormats: MovieWithFormats) => {
    // Convert MovieWithFormats to Media type
    const media: Media = {
      id: movieWithFormats.mediaDbId!,
      title: movieWithFormats.details.title,
      tmdb_id: movieWithFormats.details.id,
      synopsis: movieWithFormats.details.synopsis,
      cover_art_url: movieWithFormats.details.cover_art_url,
      release_date: movieWithFormats.details.release_date,
      director: movieWithFormats.details.director,
      cast: movieWithFormats.details.cast,
    };
    setEditingMedia(media);
    setShowMediaEditModal(true);
  };

  const handleEditFormats = (movieId: number) => {
    const movie = selectedMovies.find(m => m.movie.id === movieId);
    if (movie) {
      setOriginalFormats([...movie.formats]);
      setEditingFormatsFor(movieId);
      setShowFormatSelector(true);
    }
  };

  const handleFormatsUpdated = async (formats: string[]) => {
    if (editingFormatsFor === null || !editItem) return;
    
    // Update local state immediately for UI responsiveness
    setSelectedMovies(prev => 
      prev.map(movie => 
        movie.movie.id === editingFormatsFor 
          ? { ...movie, formats }
          : movie
      )
    );
    
    // If editing an existing item, update the backend immediately
    if (editItem) {
      try {
        const movieWithFormats = selectedMovies.find(m => m.movie.id === editingFormatsFor);
        if (movieWithFormats?.mediaDbId) {
          await apiService.updateMovieFormats(editItem.id, movieWithFormats.mediaDbId, formats);
        }
      } catch (error) {
        console.error('Failed to update movie formats:', error);
        alert('Failed to update movie formats. Please try again.');
        // Revert the local state change on error
        setSelectedMovies(prev => 
          prev.map(movie => 
            movie.movie.id === editingFormatsFor 
              ? { ...movie, formats: originalFormats }
              : movie
          )
        );
      }
    }
    
    setShowFormatSelector(false);
    setEditingFormatsFor(null);
    setOriginalFormats([]);
  };

  const handleMediaSaved = (updatedMedia: Media) => {
    // Update the movie in selectedMovies list
    setSelectedMovies(prev => prev.map(m => 
      m.mediaDbId === updatedMedia.id 
        ? { ...m, details: { ...m.details, ...updatedMedia } }
        : m
    ));
    setShowMediaEditModal(false);
    setEditingMedia(null);
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
          store_links: storeLinks,
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
          store_links: storeLinks,
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

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setShowUnifiedSearch(true)}
                      className="btn-secondary text-sm w-full"
                    >
                      + Add Movie
                    </button>
                  </div>

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
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFormats(movieWithFormats.movie.id);
                                  }}
                                  className="text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                  title="Edit formats"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMovie(movieWithFormats);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Edit movie metadata"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMovieFromPhysicalItem(movieWithFormats)}
                                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Remove movie"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
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

                  {/* Store Links */}
                  <div>
                    <StoreLinkManager
                      links={storeLinks}
                      onChange={setStoreLinks}
                      disabled={isSubmitting}
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

      {/* Unified Search Modal */}
      <UnifiedSearchModal
        isOpen={showUnifiedSearch}
        onClose={() => setShowUnifiedSearch(false)}
        onSelect={handleUnifiedSearchSelect}
        currentPhysicalItem={editItem}
      />

      {/* Media Edit Modal */}
      <MediaEditModal
        media={editingMedia}
        isOpen={showMediaEditModal}
        onClose={() => {
          setShowMediaEditModal(false);
          setEditingMedia(null);
        }}
        onSave={handleMediaSaved}
      />

      {/* Format Selector Modal */}
      <FormatSelector
        isOpen={showFormatSelector}
        onClose={() => {
          setShowFormatSelector(false);
          setEditingFormatsFor(null);
          setOriginalFormats([]);
        }}
        onConfirm={handleFormatsUpdated}
        movieTitle={editingFormatsFor ? selectedMovies.find(m => m.movie.id === editingFormatsFor)?.movie.title || '' : ''}
        initialFormats={editingFormatsFor ? selectedMovies.find(m => m.movie.id === editingFormatsFor)?.formats || [] : []}
      />
    </>
  );
};

export default MediaForm;

