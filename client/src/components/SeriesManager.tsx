import React, { useState, useEffect } from 'react';
import { Series } from '../types';
import { apiService } from '../services/api.service';

const SeriesManager: React.FC = () => {
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sort_name: '',
    tmdb_collection_id: '',
  });

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSeries();
      setSeries(data);
    } catch (error) {
      console.error('Failed to load series:', error);
      alert('Failed to load series. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        sort_name: formData.sort_name,
        tmdb_collection_id: formData.tmdb_collection_id ? parseInt(formData.tmdb_collection_id) : undefined,
      };

      if (editingSeries) {
        await apiService.updateSeries(editingSeries.id, data);
      } else {
        await apiService.createSeries(data);
      }

      setFormData({ name: '', sort_name: '', tmdb_collection_id: '' });
      setEditingSeries(null);
      setShowAddForm(false);
      await loadSeries();
    } catch (error) {
      console.error('Failed to save series:', error);
      alert('Failed to save series. Please try again.');
    }
  };

  const handleEdit = (s: Series) => {
    setEditingSeries(s);
    setFormData({
      name: s.name,
      sort_name: s.sort_name,
      tmdb_collection_id: s.tmdb_collection_id?.toString() || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this series? This will remove it from all movies.')) return;

    try {
      await apiService.deleteSeries(id);
      await loadSeries();
    } catch (error) {
      console.error('Failed to delete series:', error);
      alert('Failed to delete series. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', sort_name: '', tmdb_collection_id: '' });
    setEditingSeries(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading series...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Series</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Series'}
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {editingSeries ? 'Edit Series' : 'Add New Series'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Name *
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Used for alphabetical sorting, e.g., "Marvel Cinematic Universe, The")
                </span>
              </label>
              <input
                type="text"
                value={formData.sort_name}
                onChange={(e) => setFormData({ ...formData, sort_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TMDb Collection ID
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Optional)</span>
              </label>
              <input
                type="number"
                value={formData.tmdb_collection_id}
                onChange={(e) => setFormData({ ...formData, tmdb_collection_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingSeries ? 'Update' : 'Create'} Series
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {series.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No series created yet.</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            Create Your First Series
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {series.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sort name: {s.sort_name}</p>
                  {s.tmdb_collection_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      TMDb Collection ID: {s.tmdb_collection_id}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeriesManager;

