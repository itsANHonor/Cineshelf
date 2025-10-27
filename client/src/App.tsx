import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import CollectionPage from './pages/CollectionPage';
import MoviesPage from './pages/MoviesPage';
import Navigation from './components/Navigation';
import DynamicFavicon from './components/DynamicFavicon';

const AppContent: React.FC = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      {/* Main content area with proper spacing for sidebar and header */}
      <div className={`pt-16 lg:pt-16 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/movies" element={<MoviesPage />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the backend is available
    fetch('/api/health')
      .then(() => {
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Backend connection failed:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Cineshelf...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <DynamicFavicon />
          <Router>
            <AppContent />
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;