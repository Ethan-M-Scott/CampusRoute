'use client';

// Public landing page that introduces My Campus Route and opens auth modals.
import { Suspense, useCallback } from 'react';
import useSearchParamsDX from '../hooks/useSearchParamsDX';
import { MapPin, Bus, AlertCircle } from 'lucide-react';
import Image from 'next/image';

function SplashContent() {
  const [,setSearchParams] = useSearchParamsDX();
  const setModal = useCallback((modal: string) => setSearchParams({modal}), [setSearchParams]);
  
  const onLogin = useCallback(() => setModal("login"), [setModal]);
  const onSignUp = useCallback(() => setModal("register"), [setModal]);
  
  return (
      <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #1e40af 0%, #0c4a6e 50%, #000817 100%)'}}>
      {/*css classes used within the component*/}
      <style href="splash-page" precedence="medium">{`
        .splash-button {
          width: min(180px, 100%);
          height: 56px;
          font-size: 18px;
          font-weight: 600;
        }
        .splash-card {
          width: min(180px, 100%);
          min-height: 120px;
          background-color: rgba(255, 255, 255, 0.2);
        }
        @media (max-width: 640px) {
          .splash-button {
            width: 100%;
            font-size: 16px;
          }
          .splash-card {
            width: 100%;
            min-height: 104px;
          }
        }
      `}</style>



      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-10 sm:px-8">
        {/* Logo container */}
        <div className="relative mb-6 sm:mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white shadow-2xl flex items-center justify-center">
            <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
            <Bus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-400 shadow-lg" />
        </div>

        {/* Title */}
        <h1 className="text-white mb-3 sm:mb-4 text-center leading-tight text-4xl sm:text-5xl md:text-6xl" style={{ fontWeight: 700 }}>
          My Campus Route
        </h1>

        {/* Subtitle */}
        <p className="text-blue-300 mb-6 sm:mb-8 text-center text-sm sm:text-xl" style={{ fontWeight: 300 }}>
          Navigate Your Campus Like a Pro
        </p>

        {/* Description card */}
        <div className="max-w-xl w-full mb-8 sm:mb-12 p-5 sm:p-8 text-center backdrop-blur-md rounded-2xl" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p className="text-white text-sm sm:text-base" style={{ lineHeight: '1.6' }}>
            Real-time traffic analysis around campus. Plan routes, avoid
            congestion, track buses, get alerts.
          </p>
        </div>

        {/* Feature cards */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 sm:mb-12 w-full justify-center items-stretch">
          <div className="splash-card backdrop-blur-md rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center">
            <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
            <p className="text-white text-center">Live Traffic</p>
          </div>

          <div className="splash-card backdrop-blur-md rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center">
            <Bus className="w-7 h-7 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
            <p className="text-white text-center">Bus Tracking</p>
          </div>

          <div className="splash-card backdrop-blur-md rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center">
            <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
            <p className="text-white text-center">Road Alerts</p>
          </div>
        </div>

        {/* Buttons side by side */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-8 w-full max-w-md justify-center">
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

export default function SplashPage() {
  return (
    <Suspense fallback={null}>
      <SplashContent />
    </Suspense>
  );
}