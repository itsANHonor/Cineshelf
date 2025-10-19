import React, { useState, useEffect } from 'react';
import { Media, CreateMediaDto, TMDbMovie, Series } from '../types';
import { apiService } from '../services/api.service';
import SearchModal from './SearchModal';
import CollectionImportModal from './CollectionImportModal';

interface MediaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMedia?: Media | null;
}

interface SeriesAssociation {
  series_id: number;
  auto_sort: boolean;
  sort_order?: number;
}

const MediaForm: React.FC<MediaFormProps> = ({ isOpen, onClose, onSuccess, editMedia }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showCollectionImport, setShowCollectionImport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableSeries, setAvailableSeries] = useState<Series[]>([]);
  const [seriesAssociations, setSeriesAssociations] = useState<SeriesAssociation[]>([]);
  const [formData, setFormData] = useState<CreateMediaDto>({
    title: '',
    tmdb_id: undefined,
    synopsis: '',
    cover_art_url: '',
    release_date: '',
    director: '',
    cast: [],
    physical_format: [],
    edition_notes: '',
    region_code: '',
    custom_image_url: '',
  });

  // Load available series
  useEffect(() => {
    if (isOpen) {
      apiService.getSeries().then(setAvailableSeries).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editMedia) {
      setFormData({
        title: editMedia.title,
        tmdb_id: editMedia.tmdb_id,
        synopsis: editMedia.synopsis || '',
        cover_art_url: editMedia.cover_art_url || '',
        release_date: editMedia.release_date || '',
        director: editMedia.director || '',
        cast: editMedia.cast || [],
        physical_format: editMedia.physical_format,
        edition_notes: editMedia.edition_notes || '',
        region_code: editMedia.region_code || '',
        custom_image_url: editMedia.custom_image_url || '',
      });
      // Load existing series associations
      if (editMedia.series && editMedia.series.length > 0) {
        const associations = editMedia.series.map(s => ({
          series_id: s.id,
          auto_sort: true,
          sort_order: undefined,
        }));
        setSeriesAssociations(associations);
      } else {
        setSeriesAssociations([]);
      }
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        tmdb_id: undefined,
        synopsis: '',
        cover_art_url: '',
        release_date: '',
        director: '',
        cast: [],
        physical_format: [],
        edition_notes: '',
        region_code: '',
        custom_image_url: '',
      });
      setSeriesAssociations([]);
    }
  }, [editMedia, isOpen]);

  const handleTMDbSelect = async (movie: TMDbMovie) => {
    setShowSearch(false);
    
    try {
      const details = await apiService.getMovieDetails(movie.id);
      setFormData({
        ...formData,
        title: details.title,
        tmdb_id: details.id,
        synopsis: details.overview,
        cover_art_url: details.poster_url || '',
        release_date: details.release_date,
        director: details.director || '',
        cast: details.cast || [],
      });
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
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

  const handleCollectionImport = async (collectionId: number, collectionName: string, sortName: string) => {
    try {
      const newSeries = await apiService.createSeries({
        name: collectionName,
        sort_name: sortName,
        tmdb_collection_id: collectionId,
      });
      setAvailableSeries([...availableSeries, newSeries]);
      setSeriesAssociations([...seriesAssociations, {
        series_id: newSeries.id,
        auto_sort: true,
      }]);
      setShowCollectionImport(false);
    } catch (error) {
      console.error('Failed to import collection:', error);
      alert('Failed to import collection. Please try again.');
    }
  };

  const handleSeriesToggle = (seriesId: number) => {
    const exists = seriesAssociations.find(a => a.series_id === seriesId);
    if (exists) {
      setSeriesAssociations(seriesAssociations.filter(a => a.series_id !== seriesId));
    } else {
      setSeriesAssociations([...seriesAssociations, {
        series_id: seriesId,
        auto_sort: true,
      }]);
    }
  };

  const handleSeriesAutoSortToggle = (seriesId: number) => {
    setSeriesAssociations(seriesAssociations.map(a =>
      a.series_id === seriesId ? { ...a, auto_sort: !a.auto_sort, sort_order: a.auto_sort ? 1 : undefined } : a
    ));
  };

  const handleSeriesSortOrderChange = (seriesId: number, sortOrder: number) => {
    setSeriesAssociations(seriesAssociations.map(a =>
      a.series_id === seriesId ? { ...a, sort_order: sortOrder } : a
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one format is selected
    if (formData.physical_format.length === 0) {
      alert('Please select at least one physical format.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        series_associations: seriesAssociations,
      };

      if (editMedia) {
        await apiService.updateMedia(editMedia.id, dataToSubmit);
      } else {
        await apiService.createMedia(dataToSubmit);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save media:', error);
      alert('Failed to save media. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const imageUrl = formData.custom_image_url || formData.cover_art_url;

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
                  {editMedia ? 'Edit Media' : 'Add New Media'}
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
                      <img src={imageUrl} alt={formData.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {!editMedia && (
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="btn-primary w-full mb-4"
                    >
                      Search TMDb
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
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Physical Formats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Physical Formats * (select all that apply)
                    </label>
                    <div className="space-y-2">
                      {['4K UHD', 'Blu-ray', 'DVD', 'LaserDisc', 'VHS'].map((format) => (
                        <label key={format} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.physical_format.includes(format)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  physical_format: [...formData.physical_format, format],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  physical_format: formData.physical_format.filter((f) => f !== format),
                                });
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Release Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.release_date}
                      onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
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
                      placeholder="e.g., Steelbook, Collector's Edition"
                      value={formData.edition_notes}
                      onChange={(e) => setFormData({ ...formData, edition_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Region Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Region Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Region A, Region 1"
                      value={formData.region_code}
                      onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Director */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={formData.director}
                      onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Synopsis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Synopsis
                    </label>
                    <textarea
                      rows={4}
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Series Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Series</h3>
                  {formData.tmdb_id && (
                    <button
                      type="button"
                      onClick={() => setShowCollectionImport(true)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      + Import from TMDb
                    </button>
                  )}
                </div>

                {availableSeries.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No series available. Create one in the Series management page.</p>
                ) : (
                  <div className="space-y-2">
                    {availableSeries.map(series => {
                      const association = seriesAssociations.find(a => a.series_id === series.id);
                      const isSelected = !!association;

                      return (
                        <div key={series.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`series-${series.id}`}
                              checked={isSelected}
                              onChange={() => handleSeriesToggle(series.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                            />
                            <label htmlFor={`series-${series.id}`} className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {series.name}
                            </label>
                          </div>

                          {isSelected && association && (
                            <div className="mt-2 ml-6 space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`auto-sort-${series.id}`}
                                  checked={association.auto_sort}
                                  onChange={() => handleSeriesAutoSortToggle(series.id)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                                />
                                <label htmlFor={`auto-sort-${series.id}`} className="text-xs text-gray-600 dark:text-gray-400">
                                  Auto-sort by release date
                                </label>
                              </div>

                              {!association.auto_sort && (
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Manual Sort Order:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={association.sort_order || 1}
                                    onChange={(e) => handleSeriesSortOrderChange(series.id, parseInt(e.target.value))}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editMedia ? 'Update' : 'Add Media'}
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
        onSelect={handleTMDbSelect}
      />

      {/* Collection Import Modal */}
      {showCollectionImport && formData.tmdb_id && (
        <CollectionImportModal
          tmdbId={formData.tmdb_id}
          onClose={() => setShowCollectionImport(false)}
          onImport={handleCollectionImport}
        />
      )}
    </>
  );
};

export default MediaForm;

