import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from '../context/SidebarContext';
import { useServerMode } from '../context/ServerModeContext';

const Navigation: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { isReadOnly } = useServerMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
        aria-label="Toggle mobile menu"
      >
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
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

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        } lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-16">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/icon-32.png" alt="Cineshelf" className="w-8 h-8 dark:hidden" />
                <img src="/icon-32-dark.png" alt="Cineshelf" className="w-8 h-8 hidden dark:block" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cineshelf</h2>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center w-full">
                <img src="/icon-32.png" alt="Cineshelf" className="w-8 h-8 dark:hidden" />
                <img src="/icon-32-dark.png" alt="Cineshelf" className="w-8 h-8 hidden dark:block" />
              </div>
            )}
            
            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? 'Collection' : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="M7 3v18"/>
                <path d="M3 12h18"/>
              </svg>
              {!isCollapsed && <span>Collection</span>}
            </Link>

            {!isReadOnly && (
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/admin')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isCollapsed ? 'Settings' : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!isCollapsed && <span>Settings</span>}
              </Link>
            )}

            {!isReadOnly && (
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/about')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isCollapsed ? 'About' : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!isCollapsed && <span>About</span>}
              </Link>
            )}
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {isCollapsed ? (
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className={`fixed top-0 right-0 left-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 transition-all duration-300 ease-in-out h-16 ${
        isCollapsed ? 'lg:left-16' : 'lg:left-64'
      }`}>
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-4">
            {/* Page Title - could be dynamic based on route */}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {location.pathname === '/' && 'Collection'}
              {!isReadOnly && location.pathname === '/movies' && 'Movies'}
              {!isReadOnly && location.pathname === '/admin' && 'Settings'}
              {!isReadOnly && location.pathname === '/about' && 'About'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Future: User menu, notifications, etc. */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {/* Placeholder for user info */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;


