import React from 'react';
import { Link } from 'react-router-dom';

interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
}

interface HomePageProps {
  health: HealthCheck | null;
}

const HomePage: React.FC<HomePageProps> = ({ health }) => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-primary-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M7 3v18"/>
              <path d="M3 7.5h4"/>
              <path d="M3 12h18"/>
              <path d="M3 16.5h4"/>
              <path d="M17 3v18"/>
              <path d="M17 7.5h4"/>
              <path d="M17 16.5h4"/>
            </svg>
            <h1 className="text-6xl font-bold text-gray-900">Display Case</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            A beautiful, modern way to catalog and showcase your physical media collection
          </p>
          <p className="text-lg text-gray-500">
            Organize your Blu-rays, 4K UHDs, and DVDs with metadata from The Movie Database
          </p>
        </div>

        {/* Status */}
        {health && (
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium">Backend Connected</span>
              <span className="ml-2 text-sm opacity-75">v{health.version}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            to="/collection"
            className="btn-primary inline-block w-full sm:w-auto text-lg py-3 px-8"
          >
            View Collection
          </Link>
          <Link
            to="/admin"
            className="btn-secondary inline-block w-full sm:w-auto text-lg py-3 px-8"
          >
            Admin Panel
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
            <p className="text-gray-600">
              Find movies instantly with TMDb integration for complete metadata and cover art
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Beautiful Gallery</h3>
            <p className="text-gray-600">
              Showcase your collection with responsive design and custom photo uploads
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy Control</h3>
            <p className="text-gray-600">
              Make your collection public or keep it private with simple admin controls
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
