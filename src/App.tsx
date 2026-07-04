// Legacy local UI playground used for testing route and form views.
import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen_v2';
import { NonAuthenticatedView } from './components/NonAuthenticatedView';
import { AuthenticatedView } from './components/AuthenticatedView_v2';
import { FormView } from './components/FormView_v2';

type View = 'splash' | 'non-auth' | 'authenticated' | 'form';

export type Route = {
  id: number;
  startLocation: string;
  endLocation: string;
  arrivalTime: string;
};

const initialRoutes: Route[] = [
  {
    id: 1,
    startLocation: 'Home',
    endLocation: 'MLC',
    arrivalTime: '08:30',
  },
  {
    id: 2,
    startLocation: 'East Campus Village',
    endLocation: 'Tate Center',
    arrivalTime: '09:15',
  },
  {
    id: 3,
    startLocation: 'Parking Deck W05',
    endLocation: 'Sanford Stadium',
    arrivalTime: '18:00',
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('splash');
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);

  const handleAddRoute = (data: {
    startLocation: string;
    endLocation: string;
    arrivalTime: string;
  }) => {
    const nextId = routes.length ? routes[routes.length - 1].id + 1 : 1;
    setRoutes((prev) => [
      ...prev,
      {
        id: nextId,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        arrivalTime: data.arrivalTime,
      },
    ]);
    setCurrentView('authenticated');
  };

  const handleDeleteRoute = (id: number) => {
    setRoutes((prev) => prev.filter((route) => route.id !== id));
  };

  return (
    <div className="font-sans">
      {currentView === 'splash' && (
        <SplashScreen
          onLogin={() => setCurrentView('non-auth')}
          onSignUp={() => setCurrentView('non-auth')}
          onContinue={() => setCurrentView('non-auth')}
        />
      )}

      {currentView === 'non-auth' && (
        <NonAuthenticatedView
          onLogin={() => setCurrentView('authenticated')}
          onSignUp={() => setCurrentView('authenticated')}
        />
      )}

      {currentView === 'authenticated' && (
        <AuthenticatedView
          onLogout={() => setCurrentView('non-auth')}
          onAddRoute={() => setCurrentView('form')}
          routes={routes}
          onDeleteRoute={handleDeleteRoute}
          // username={currentUser.username} 
        />
      )}

      {currentView === 'form' && (
        <FormView
          onClose={() => setCurrentView('authenticated')}
          onSaveRoute={handleAddRoute}
        />
      )}

      {/* Local view switcher for testing */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl p-2 flex gap-2 z-50">
        <button
          onClick={() => setCurrentView('splash')}
          className={`px-4 py-2 rounded-full transition-colors ${
            currentView === 'splash'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Splash
        </button>
        <button
          onClick={() => setCurrentView('non-auth')}
          className={`px-4 py-2 rounded-full transition-colors ${
            currentView === 'non-auth'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non-Auth
        </button>
        <button
          onClick={() => setCurrentView('authenticated')}
          className={`px-4 py-2 rounded-full transition-colors ${
            currentView === 'authenticated'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Authenticated
        </button>
        <button
          onClick={() => setCurrentView('form')}
          className={`px-4 py-2 rounded-full transition-colors ${
            currentView === 'form'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Form
        </button>
      </div>
    </div>
  );
}
