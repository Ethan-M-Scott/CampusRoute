'use client';

import { useRouter } from 'next/navigation';
import useSearchParamsDX from '../hooks/useSearchParamsDX';
import { MapPin, Bus, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCallback } from 'react';

export default function SplashPage() {
  const router = useRouter();
  const [,setSearchParams] = useSearchParamsDX();
  const setModal = useCallback((modal: string) => setSearchParams({modal}), [setSearchParams]);
  
  const onLogin = useCallback(() => setModal("login"), [setModal]);
  const onSignUp = useCallback(() => setModal("register"), [setModal]);
  
  return (
      <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #1e40af 0%, #0c4a6e 50%, #000817 100%)'}}>
      {/*css classes used within the component*/}
      <style href="splash-page" precedence="medium">{`
        .splash-button {
          width: 180px;
          height: 56px;
          font-size: 18px;
          font-weight: 600;
        }
        .splash-card {
          width: 180px;
          height: 120px;
          backgroundColor: rgba(255, 255, 255, 0.2);
        }
      `}</style>



      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-8">
        {/* Logo container */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center">
            <MapPin className="w-16 h-16 text-blue-600" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-400 shadow-lg" />
        </div>

        {/* Title */}
        <h1 className="text-white mb-4 text-center" style={{ fontSize: '60px', fontWeight: 700 }}>
          CampusRoute
        </h1>

        {/* Subtitle */}
        <p className="text-blue-300 mb-8 text-center" style={{ fontSize: '20px', fontWeight: 300 }}>
          Navigate Your Campus Like a Pro
        </p>

        {/* Description card */}
        <div className="max-w-xl w-full mb-12 p-8 text-center backdrop-blur-md rounded-2xl" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p className="text-white" style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Real-time traffic analysis around campus. Plan routes, avoid
            congestion, track buses, get alerts.
          </p>
        </div>

        {/* Feature cards */}
        <div className="flex gap-6 mb-12">
          <div className="splash-card backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center">
            <MapPin className="w-8 h-8 text-white mb-3" />
            <p className="text-white text-center">Live Traffic</p>
          </div>

          <div className="splash-card backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center">
            <Bus className="w-8 h-8 text-white mb-3" />
            <p className="text-white text-center">Bus Tracking</p>
          </div>

          <div className="splash-card backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white mb-3" />
            <p className="text-white text-center">Road Alerts</p>
          </div>
        </div>

        {/* Buttons side by side */}
        <div className="flex gap-4 mt-8">
          <button onClick={onLogin} className="splash-button bg-white text-blue-600 rounded-full shadow-xl hover:scale-105 transition-all">
            Login
          </button>

          <button onClick={onSignUp} className="splash-button bg-white text-blue-600 rounded-full shadow-xl hover:scale-105 transition-all">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}