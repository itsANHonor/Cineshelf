import React, { useState, useEffect } from 'react';
import { Media } from '../types';
import { apiService } from '../services/api.service';

interface MediaEditModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMedia: Media) => void;
}

interface TMDBComparison {
  current: any;
  tmdb: any;
  tmdb_id: number;
}

const MediaEditModal: React.FC<MediaEditModalProps> = ({ media, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    director: '',
    release_date: '',
    cover_art_url: '',
  });
  const [cast, setCast] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [tmdbData, setTmdbData] = useState<TMDBComparison | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (media && isOpen) {
      setFormData({
        title: media.title || '',
        synopsis: media.synopsis || '',
        director: media.director || '',
        release_date: media.release_date || '',
        cover_art_url: media.cover_art_url || '',
      });
      setCast(media.cast || []);
      setTmdbData(null);
      setSelectedFields([]);
    }
  }, [media, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCastChange = (index: number, value: string) => {
    const newCast = [...cast];
    newCast[index] = value;
    setCast(newCast);
  };

  const addCastMember = () => {
    setCast([...cast, '']);
  };

  const removeCastMember = (index: number) => {
    setCast(cast.filter((_, i) => i !== index));
  };

  const handleRefreshFromTMDB = async () => {
    if (!media?.tmdb_id) return;

    setIsRefreshing(true);
    try {
      const data = await apiService.refreshMediaFromTMDB(media.id);
      setTmdbData(data);
    } catch (error) {
      console.error('Failed to refresh TMDB data:', error);
      alert('Failed to refresh TMDB data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleApplyTMDBFields = async () => {
    if (!media || selectedFields.length === 0) return;

    setIsSaving(true);
    try {
      const updatedMedia = await apiService.updateMediaFromTMDB(media.id, selectedFields);
      onSave(updatedMedia);
      setTmdbData(null);
      setSelectedFields([]);
    } catch (error) {
      console.error('Failed to apply TMDB fields:', error);
      alert('Failed to apply TMDB fields. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!media) return;

    setIsSaving(true);
    try {
      const updatedMedia = await apiService.updateMedia(media.id, {
        ...formData,
        cast: cast.filter(c => c.trim() !== ''),
      });
      onSave(updatedMedia);
      onClose();
    } catch (error) {
      console.error('Failed to save media:', error);
      alert('Failed to save media. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Media: {media.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {/* TMDB Refresh Section */}
            {media.tmdb_id && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Refresh from TMDB
                  </h3>
                  <button
                    onClick={handleRefreshFromTMDB}
                    disabled={isRefreshing}
                    className="btn-primary"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh from TMDB'}
                  </button>
                </div>

                {tmdbData && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Compare current data with latest TMDB data and select which fields to update:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Current Data */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Current Data</h4>
                        <div className="space-y-3">
                          {Object.entries(tmdbData.current).map(([key, _value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`current-${key}`}
                                checked={selectedFields.includes(key)}
                                onChange={() => handleFieldToggle(key)}
                                className="rounded"
                              />
                              <label htmlFor={`current-${key}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TMDB Data */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">TMDB Data</h4>
                        <div className="space-y-3">
                          {Object.entries(tmdbData.tmdb).map(([key, _value]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                              </span>
                              <div className="mt-1 text-gray-600 dark:text-gray-400">
                                {key === 'cast' ? (_value as string[]).join(', ') : String(_value || 'N/A')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setTmdbData(null)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplyTMDBFields}
                        disabled={selectedFields.length === 0 || isSaving}
                        className="btn-primary"
                      >
                        {isSaving ? 'Applying...' : `Apply ${selectedFields.length} Fields`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Edit Form */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Manual Edit
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Director
                    </label>
                    <input
                      type="text"
                      value={formData.director}
                      onChange={(e) => handleInputChange('director', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.release_date}
                      onChange={(e) => handleInputChange('release_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cover Art URL
                    </label>
                    <input
                      type="url"
                      value={formData.cover_art_url}
                      onChange={(e) => handleInputChange('cover_art_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    {formData.cover_art_url && (
                      <img
                        src={formData.cover_art_url}
                        alt="Cover preview"
                        className="mt-2 w-32 h-48 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Synopsis
                    </label>
                    <textarea
                      value={formData.synopsis}
                      onChange={(e) => handleInputChange('synopsis', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cast
                    </label>
                    <div className="space-y-2">
                      {cast.map((member, index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={member}
                            onChange={(e) => handleCastChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Cast member name"
                          />
                          <button
                            type="button"
                            onClick={() => removeCastMember(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCastMember}
                        className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        + Add Cast Member
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaEditModal;
