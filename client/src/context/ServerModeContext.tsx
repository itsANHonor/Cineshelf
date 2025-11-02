import React, { createContext, useContext, useState, useEffect } from 'react';

interface ServerModeContextType {
  isReadOnly: boolean;
  isLoading: boolean;
}

const ServerModeContext = createContext<ServerModeContextType | undefined>(undefined);

export const ServerModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkServerMode = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setIsReadOnly(data.mode === 'readonly');
      } catch (error) {
        console.error('Failed to check server mode:', error);
        // Default to read-only mode if health check fails for safety
        setIsReadOnly(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkServerMode();
  }, []);

  return (
    <ServerModeContext.Provider value={{ isReadOnly, isLoading }}>
      {children}
    </ServerModeContext.Provider>
  );
};

export const useServerMode = () => {
  const context = useContext(ServerModeContext);
  if (context === undefined) {
    throw new Error('useServerMode must be used within a ServerModeProvider');
  }
  return context;
};

