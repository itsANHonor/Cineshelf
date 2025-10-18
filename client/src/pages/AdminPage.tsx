import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Media } from '../types';
import { apiService } from '../services/api.service';
import MediaForm from '../components/MediaForm';

const AdminPage: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin state
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mediaData, settings] = await Promise.all([
        apiService.getMedia(),
        apiService.getSettings(),
      ]);
      setMedia(mediaData);
      setIsPublic(settings.collection_public === 'true');
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const success = await login(password);
    if (success) {
      setPassword('');
    } else {
      setLoginError('Invalid password');
    }
    setIsLoggingIn(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiService.deleteMedia(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleTogglePublic = async () => {
    setIsSavingSettings(true);
    try {
      await apiService.updateSetting('collection_public', (!isPublic).toString());
      setIsPublic(!isPublic);
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
              <p className="text-gray-600">Enter your admin password to continue</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter admin password"
                  autoFocus
                />
                {loginError && (
                  <p className="mt-2 text-sm text-red-600">{loginError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || !password}
                className="btn-primary w-full mb-4"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>

              <Link to="/" className="btn-secondary w-full text-center block">
                ← Back to Home
              </Link>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: media.length,
    uhd: media.filter((m) => m.physical_format === '4K UHD').length,
    bluray: media.filter((m) => m.physical_format === 'Blu-ray').length,
    dvd: media.filter((m) => m.physical_format === 'DVD').length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage your media collection</p>
        </div>
        <div className="flex gap-2">
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
          <Link to="/" className="btn-secondary">
            ← Home
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => setShowAddForm(true)}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Add New Media</h3>
          </div>
          <p className="text-gray-600 mb-4">Search TMDb and add a new item to your collection</p>
          <button className="btn-primary w-full">Add Media</button>
        </div>

        <Link to="/collection" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">View Collection</h3>
          </div>
          <p className="text-gray-600 mb-4">Browse your collection as visitors would see it</p>
          <button className="btn-secondary w-full">View Gallery</button>
        </Link>

        <div
          onClick={() => setShowSettings(!showSettings)}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Settings</h3>
          </div>
          <p className="text-gray-600 mb-4">Configure privacy and site preferences</p>
          <button className="btn-secondary w-full">
            {showSettings ? 'Hide Settings' : 'Open Settings'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Collection Visibility</h4>
              <p className="text-sm text-gray-600">
                {isPublic ? 'Your collection is publicly visible' : 'Your collection is private'}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={isSavingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">Collection Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.uhd}</div>
            <div className="text-sm text-gray-600">4K UHD</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.bluray}</div>
            <div className="text-sm text-gray-600">Blu-ray</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.dvd}</div>
            <div className="text-sm text-gray-600">DVD</div>
          </div>
        </div>
      </div>

      {/* Media List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">All Media ({media.length})</h3>
        {media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No media items yet</p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {(item.custom_image_url || item.cover_art_url) ? (
                    <img
                      src={item.custom_image_url || item.cover_art_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{item.physical_format}</span>
                    {item.release_date && (
                      <span>{new Date(item.release_date).getFullYear()}</span>
                    )}
                    {item.edition_notes && <span className="italic">• {item.edition_notes}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMedia(item);
                      setShowAddForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <MediaForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingMedia(null);
        }}
        onSuccess={() => {
          loadData();
          setEditingMedia(null);
        }}
        editMedia={editingMedia}
      />
    </div>
  );
};

export default AdminPage;
