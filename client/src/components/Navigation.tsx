import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo/Title */}
          <div className="mb-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Cineshelf
            </h2>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            <Link
              to="/"
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M7 3v18"/>
                  <path d="M3 12h18"/>
                </svg>
                <span>Collection</span>
              </div>
            </Link>

            <Link
              to="/admin"
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </div>
            </Link>

            <Link
              to="/about"
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                isActive('/about')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </div>
            </Link>
          </nav>

          {/* Theme Toggle */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;


