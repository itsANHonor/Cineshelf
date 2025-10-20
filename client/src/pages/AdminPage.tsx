import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PhysicalItem, SortField, SortOrder } from '../types';
import { apiService } from '../services/api.service';
import MediaForm from '../components/MediaForm';
import SeriesManager from '../components/SeriesManager';
import BulkAddForm from '../components/BulkAddForm';

type AdminTab = 'media' | 'series' | 'settings';

const AdminPage: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const { setTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin state
  const [activeTab, setActiveTab] = useState<AdminTab>('media');
  const [physicalItems, setPhysicalItems] = useState<PhysicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PhysicalItem | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [defaultSortBy, setDefaultSortBy] = useState<SortField>('created_at');
  const [defaultSortOrder, setDefaultSortOrder] = useState<SortOrder>('desc');
  const [collectionTitle, setCollectionTitle] = useState('Media Collection');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');
  const [showImportSchema, setShowImportSchema] = useState(false);
  const [importSchema, setImportSchema] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [items, settings] = await Promise.all([
        apiService.getPhysicalItems(),
        apiService.getSettings(),
      ]);
      setPhysicalItems(items);
      setIsPublic(settings.collection_public === 'true');
      setDefaultTheme((settings.default_theme as 'light' | 'dark' | 'system') || 'light');
      setDefaultSortBy((settings.default_sort_by as SortField) || 'created_at');
      setDefaultSortOrder((settings.default_sort_order as SortOrder) || 'desc');
      setCollectionTitle(settings.collection_title || 'Media Collection');
      // Apply admin's default theme
      if (settings.default_theme) {
        setTheme(settings.default_theme as 'light' | 'dark' | 'system');
      }
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
    if (!confirm('Are you sure you want to delete this physical item?')) return;

    try {
      await apiService.deletePhysicalItem(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete physical item:', error);
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

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setIsSavingSettings(true);
    try {
      await apiService.updateSetting('default_theme', newTheme);
      setDefaultTheme(newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Failed to update theme:', error);
      alert('Failed to update theme. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSortChange = async (field: SortField, order: SortOrder) => {
    setIsSavingSettings(true);
    try {
      await apiService.updateSettings({
        default_sort_by: field,
        default_sort_order: order,
      });
      setDefaultSortBy(field);
      setDefaultSortOrder(order);
    } catch (error) {
      console.error('Failed to update sort settings:', error);
      alert('Failed to update sort settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCollectionTitleChange = async (newTitle: string) => {
    setIsSavingSettings(true);
    try {
      await apiService.updateSetting('collection_title', newTitle);
      setCollectionTitle(newTitle);
    } catch (error) {
      console.error('Failed to update collection title:', error);
      alert('Failed to update collection title. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await apiService.exportCollection();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `cineshelf-export-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export collection:', error);
      alert('Failed to export collection. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      
      // Validate first
      const validation = await apiService.validateCSV(text);
      
      if (!validation.valid) {
        const errorMessage = validation.errors.map((e: any) => `Row ${e.row}: ${e.error}`).join('\n');
        alert(`CSV validation failed:\n\n${errorMessage}`);
        setIsImporting(false);
        return;
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessage = validation.warnings.map((w: any) => `Row ${w.row}: ${w.warning}`).join('\n');
        const proceed = confirm(`CSV has warnings:\n\n${warningMessage}\n\nDo you want to proceed with import?`);
        if (!proceed) {
          setIsImporting(false);
          return;
        }
      }

      // Confirm import
      const modeText = importMode === 'replace' ? 'REPLACE your entire collection' : 'ADD to your collection';
      const confirmMessage = `Import ${validation.total_rows} items and ${modeText}?\n\n${importMode === 'replace' ? 'WARNING: This will DELETE all existing items!' : ''}`;
      
      if (!confirm(confirmMessage)) {
        setIsImporting(false);
        return;
      }

      // Import
      const result = await apiService.importCollection(text, importMode);
      
      if (result.success) {
        alert(`Import completed!\n\nSuccessful: ${result.results.successful}\nFailed: ${result.results.failed}`);
        await loadData(); // Reload the collection
      } else {
        alert('Import failed. Please check your CSV file and try again.');
      }
    } catch (error) {
      console.error('Failed to import collection:', error);
      alert('Failed to import collection. Please try again.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleViewSchema = async () => {
    if (!importSchema) {
      try {
        const schema = await apiService.getImportExportSchema();
        setImportSchema(schema);
      } catch (error) {
        console.error('Failed to load schema:', error);
      }
    }
    setShowImportSchema(!showImportSchema);
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
    total: physicalItems.length,
    uhd: physicalItems.filter((item) => item.physical_format.includes('4K UHD')).length,
    bluray: physicalItems.filter((item) => item.physical_format.includes('Blu-ray')).length,
    dvd: physicalItems.filter((item) => item.physical_format.includes('DVD')).length,
    laserdisc: physicalItems.filter((item) => item.physical_format.includes('LaserDisc')).length,
    vhs: physicalItems.filter((item) => item.physical_format.includes('VHS')).length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your media collection</p>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
        <button
          onClick={() => setActiveTab('media')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Media Collection
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'series'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Series
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Media Tab */}
      {activeTab === 'media' && (
        <>
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

        <div
          onClick={() => setShowBulkAdd(true)}
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Bulk Add Movies</h3>
          </div>
          <p className="text-gray-600 mb-4">Import multiple movies at once from a list of titles</p>
          <button className="btn-primary w-full">Bulk Import</button>
        </div>

        <Link to="/" className="card hover:shadow-md transition-shadow">
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

      </div>

      {/* Stats */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">Collection Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.laserdisc}</div>
            <div className="text-sm text-gray-600">LaserDisc</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.vhs}</div>
            <div className="text-sm text-gray-600">VHS</div>
          </div>
        </div>
      </div>

      {/* Bulk Add Form */}
      {showBulkAdd && (
        <div className="mb-8">
          <BulkAddForm onSuccess={loadData} />
          <div className="mt-4">
            <button
              onClick={() => setShowBulkAdd(false)}
              className="btn-secondary"
            >
              Close Bulk Add
            </button>
          </div>
        </div>
      )}

      {/* Physical Items List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">All Physical Items ({physicalItems.length})</h3>
        {physicalItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No physical items yet</p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {physicalItems.map((item) => {
              const primaryMedia = item.media[0];
              const imageUrl = item.custom_image_url || primaryMedia?.cover_art_url;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {primaryMedia?.title || item.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
                      {item.physical_format.map((format, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {format}
                        </span>
                      ))}
                      {primaryMedia?.release_date && (
                        <span>{new Date(primaryMedia.release_date).getFullYear()}</span>
                      )}
                      {item.media.length > 1 && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                          {item.media.length} movies
                        </span>
                      )}
                      {item.edition_notes && <span className="italic">• {item.edition_notes}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowAddForm(true);
                      }}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Add/Edit Form Modal */}
        <MediaForm
          isOpen={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            loadData();
            setEditingItem(null);
          }}
          editItem={editingItem}
        />
      </>
      )}

      {/* Series Tab */}
      {activeTab === 'series' && (
        <SeriesManager />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Collection Visibility</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 dark:text-gray-300 mb-1">Make collection public</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow anyone to view your collection without logging in
                </p>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isSavingSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
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

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Collection Title</h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize the main heading displayed on your collection page.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Title
                </label>
                <input
                  type="text"
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  onBlur={() => handleCollectionTitleChange(collectionTitle)}
                  disabled={isSavingSettings}
                  placeholder="Media Collection"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  e.g., "Alex's Bluray Bonanza" or "My Movie Collection"
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Default Theme</h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Set your preferred theme. This will be applied when you log in to the admin panel.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  disabled={isSavingSettings}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    defaultTheme === 'light'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="font-medium">Light</span>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  disabled={isSavingSettings}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    defaultTheme === 'dark'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="font-medium">Dark</span>
                  </div>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  disabled={isSavingSettings}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    defaultTheme === 'system'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">System</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Default Sort Order (Admin)</h3>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your preferred default sorting for the collection. This will be used when you view the collection as admin.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort by
                  </label>
                  <select
                    value={defaultSortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortField, defaultSortOrder)}
                    disabled={isSavingSettings}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="title">Title</option>
                    <option value="series_sort">Series</option>
                    <option value="director_last_name">Director</option>
                    <option value="release_date">Year</option>
                    <option value="created_at">Added</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <select
                    value={defaultSortOrder}
                    onChange={(e) => handleSortChange(defaultSortBy, e.target.value as SortOrder)}
                    disabled={isSavingSettings}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="asc">Ascending (A-Z, 0-9)</option>
                    <option value="desc">Descending (Z-A, 9-0)</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p><strong>Note:</strong> Public users will default to "Title (Ascending)" sorting and their preferences will be saved in their browser session.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Import / Export Collection</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your collection to CSV for backup or migration. Import CSV files to add or replace your collection.
              </p>

              {/* Export Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Collection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download your entire collection as a CSV file with all metadata.
                </p>
                <button
                  onClick={handleExport}
                  disabled={isExporting || physicalItems.length === 0}
                  className="btn-primary"
                >
                  {isExporting ? 'Exporting...' : `Export ${stats.total} Items to CSV`}
                </button>
              </div>

              {/* Import Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Import Collection</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Import media items from a CSV file. The CSV must include at minimum: title and physical_format.
                </p>
                
                <div className="mb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="add"
                      checked={importMode === 'add'}
                      onChange={(e) => setImportMode(e.target.value as 'add' | 'replace')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <span>Add to existing collection</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value as 'add' | 'replace')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-red-600 dark:text-red-400 font-medium">Replace entire collection (deletes all existing items)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <label className="btn-primary cursor-pointer">
                    {isImporting ? 'Importing...' : 'Choose CSV File to Import'}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleImport}
                      disabled={isImporting}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleViewSchema}
                    className="btn-secondary"
                  >
                    {showImportSchema ? 'Hide' : 'View'} CSV Schema
                  </button>
                </div>
              </div>

              {/* Schema Documentation */}
              {showImportSchema && importSchema && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 mt-4">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">CSV Import Schema</h5>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <p className="font-medium">Required Fields:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">title</code> - The title of the media item</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">physical_format</code> - Must be one of: 4K UHD, Blu-ray, DVD, LaserDisc, VHS</li>
                    </ul>
                    <p className="font-medium mt-3">Optional Fields:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">tmdb_id</code> - The Movie Database ID (integer)</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">synopsis</code> - Plot description</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">cover_art_url</code> - URL to cover image</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">release_date</code> - Date in YYYY-MM-DD format</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">director</code> - Director name(s)</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">cast</code> - JSON array of cast members</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">edition_notes</code> - Edition details</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">region_code</code> - Region code</li>
                      <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">custom_image_url</code> - URL to custom image</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Example CSV:</p>
                      <pre className="text-xs mt-2 overflow-x-auto">
{importSchema.example_csv}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Collection Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.uhd}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">4K UHD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.bluray}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Blu-ray</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.dvd}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">DVD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.laserdisc}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">LaserDisc</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.vhs}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">VHS</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
