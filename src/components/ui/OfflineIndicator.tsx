"use client";

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Keep the indicator visible for a moment when coming back online
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 flex items-center ${
      isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span>
        {isOnline ? 'Back Online' : 'You are offline. Some features may be unavailable.'}
      </span>
    </div>
  );
}
