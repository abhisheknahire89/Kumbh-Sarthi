import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MapView } from './components/MapView';
import { FacilitiesPanel } from './components/FacilitiesPanel';
import { EmergencyPanel } from './components/EmergencyPanel';
import { useAuth } from './contexts/AuthContext';
import { SpinnerIcon } from './components/icons';
import { getCurrentLocation } from './services/locationService';
import type { Coordinates, FacilityType } from './types';

function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<'chat' | 'profile' | 'map' | 'facilities' | 'emergency'>('chat');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location on app load
  useEffect(() => {
    getCurrentLocation()
      .then(setUserLocation)
      .catch(err => {
        setLocationError(err.message);
        console.log('Location not available:', err.message);
      });
  }, []);

  if (loading) {
    return (
      <div className="dark flex flex-col h-screen font-sans text-brand-text-primary bg-brand-bg antialiased items-center justify-center">
        <div className="text-5xl mb-4 animate-pulse">🙏</div>
        <div className="text-brand-text-secondary">Loading Kumbh Sarthi...</div>
      </div>
    );
  }

  // Make authentication optional for public event app
  // Users can use basic features without logging in
  const showAuthPage = false; // Set to true if you want to require login

  if (showAuthPage && !session) {
    return <AuthPage />;
  }

  const handleShowMap = (type: FacilityType) => {
    setSelectedFacilityType(type);
    setPage('map');
  };

  return (
    <div className="dark flex flex-col h-screen font-sans text-brand-text-primary bg-brand-bg antialiased animate-fade-in">
      <div className="absolute inset-0 z-[-1] opacity-[0.03]" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/subtle-grunge.png)' }}></div>

      <Header setPage={setPage} currentPage={page} />

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto">
        {page === 'chat' && <ChatInterface />}

        {page === 'profile' && session && <ProfilePage setPage={setPage} />}

        {page === 'map' && (
          <div className="flex-1 p-4">
            <MapView
              userLocation={userLocation}
              selectedType={selectedFacilityType}
              height="calc(100vh - 200px)"
            />
          </div>
        )}

        {page === 'facilities' && (
          <FacilitiesPanel
            userLocation={userLocation}
            onShowMap={handleShowMap}
          />
        )}

        {page === 'emergency' && (
          <div className="flex-1 p-4">
            <EmergencyPanel
              userLocation={userLocation}
              onClose={() => setPage('chat')}
            />
          </div>
        )}
      </main>

      {/* Location Status Banner */}
      {locationError && (
        <div className="fixed bottom-4 left-4 right-4 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center text-sm text-amber-400 z-50">
          📍 Location not available: {locationError}
          <button
            onClick={() => getCurrentLocation().then(setUserLocation).catch(() => { })}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default App;