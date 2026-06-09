'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import type { School } from '@/src/data/schools';

export type RouteItem = {
  id: number;
  startLocation: string;
  endLocation: string;
  arrivalTime: string;
};

type AppState = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  routes: RouteItem[];
  addRoute: (data: {
    startLocation: string;
    endLocation: string;
    arrivalTime: string;
  }) => void;
  deleteRoute: (id: number) => void;
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

const initialRoutes: RouteItem[] = [
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const addRoute: AppState['addRoute'] = (data) => {
    setRoutes((prev) => {
      const nextId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      return [...prev, { id: nextId, ...data }];
    });
  };

  const deleteRoute: AppState['deleteRoute'] = (id) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const value: AppState = {
    isLoggedIn,
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
    routes,
    addRoute,
    deleteRoute,
    selectedSchool,
    setSelectedSchool,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
