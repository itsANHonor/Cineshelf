import React from 'react';
import { PhysicalItem } from '../types';

interface MediaDetailModalProps {
  physicalItem: PhysicalItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ physicalItem, isOpen, onClose }) => {
  if (!isOpen || !physicalItem) return null;

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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6">
            {/* Physical Item Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {physicalItem.name}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Physical Item Details */}
                <div className="space-y-4">
                  {/* Physical Format */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Formats</h3>
                    <div className="flex flex-wrap gap-2">
                      {physicalItem.physical_format.map((format, idx) => (
                        <span key={idx} className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Edition Notes */}
                  {physicalItem.edition_notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Edition</h3>
                      <p className="text-gray-900 dark:text-gray-100">{physicalItem.edition_notes}</p>
                    </div>
                  )}

                  {/* Purchase Date */}
                  {physicalItem.purchase_date && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Purchase Date</h3>
                      <p className="text-gray-900 dark:text-gray-100">{new Date(physicalItem.purchase_date).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Store Links */}
                  {physicalItem.store_links && physicalItem.store_links.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Store / Release Links</h3>
                      <div className="flex flex-wrap gap-2">
                        {physicalItem.store_links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                          >
                            {link.label}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Added: {new Date(physicalItem.created_at || '').toLocaleDateString()}</p>
                  {physicalItem.updated_at && physicalItem.updated_at !== physicalItem.created_at && (
                    <p>Updated: {new Date(physicalItem.updated_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Movies Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Movies ({physicalItem.media.length})
              </h3>
              
              {physicalItem.media.length === 1 ? (
                // Single movie: Simple card layout
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Movie Poster */}
                    <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                      {physicalItem.media[0].cover_art_url ? (
                        <img
                          src={physicalItem.media[0].cover_art_url}
                          alt={physicalItem.media[0].title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Movie Details */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {physicalItem.media[0].title}
                        </h4>
                        {physicalItem.media[0].release_date && (
                          <p className="text-lg text-gray-600 dark:text-gray-300">
                            {new Date(physicalItem.media[0].release_date).getFullYear()}
                          </p>
                        )}
                      </div>

                      {/* Per-Movie Formats */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Formats for this movie</h5>
                        <div className="flex flex-wrap gap-2">
                          {(physicalItem.media[0].formats || ['Blu-ray']).map((format, formatIdx) => (
                            <span key={formatIdx} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                              {format}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Director */}
                      {physicalItem.media[0].director && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Director</h5>
                          <p className="text-gray-900 dark:text-gray-100">{physicalItem.media[0].director}</p>
                        </div>
                      )}

                      {/* Cast */}
                      {physicalItem.media[0].cast && physicalItem.media[0].cast.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cast</h5>
                          <p className="text-gray-900 dark:text-gray-100 text-sm">{physicalItem.media[0].cast.join(', ')}</p>
                        </div>
                      )}

                      {/* Synopsis */}
                      {physicalItem.media[0].synopsis && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Synopsis</h5>
                          <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">{physicalItem.media[0].synopsis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Multiple movies: Horizontal scrollable layout
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-6 snap-x snap-mandatory">
                    {physicalItem.media.map((movie, idx) => {
                      const imageUrl = movie.cover_art_url;
                      
                      return (
                        <div key={idx} className="flex-shrink-0 w-full md:w-[600px] snap-start bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Movie Poster */}
                            <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h18M3 12h18M3 16h18" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Movie Details */}
                            <div className="col-span-2 space-y-4">
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                                  {movie.title}
                                </h4>
                                {movie.release_date && (
                                  <p className="text-lg text-gray-600 dark:text-gray-300">
                                    {new Date(movie.release_date).getFullYear()}
                                  </p>
                                )}
                              </div>

                              {/* Per-Movie Formats */}
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Formats for this movie</h5>
                                <div className="flex flex-wrap gap-2">
                                  {(movie.formats || ['Blu-ray']).map((format, formatIdx) => (
                                    <span key={formatIdx} className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                                      {format}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Director */}
                              {movie.director && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Director</h5>
                                  <p className="text-gray-900 dark:text-gray-100">{movie.director}</p>
                                </div>
                              )}

                              {/* Cast */}
                              {movie.cast && movie.cast.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cast</h5>
                                  <p className="text-gray-900 dark:text-gray-100 text-sm">{movie.cast.join(', ')}</p>
                                </div>
                              )}

                              {/* Synopsis */}
                              {movie.synopsis && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Synopsis</h5>
                                  <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">{movie.synopsis}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailModal;

