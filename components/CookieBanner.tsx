'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged
    const hasAcknowledged = localStorage.getItem('cookie-consent');
    if (!hasAcknowledged) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-900 to-orange-900 border-t-2 border-purple-500/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl flex-shrink-0">🍪</span>
              <p className="text-white text-sm leading-relaxed">
                <span className="font-semibold">Ved å bruke denne nettsiden godtar du</span> vår bruk av informasjonskapsler (cookies) for analyse og forbedring av brukeropplevelsen. Vi bruker Google Analytics og Microsoft Clarity for å forstå hvordan siden brukes.
              </p>
            </div>
            <button
              onClick={handleAccept}
              className="flex-shrink-0 bg-white hover:bg-gray-100 text-purple-900 px-6 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Jeg forstår
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

