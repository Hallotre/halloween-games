'use client';

import { useEffect } from 'react';
import clarity from '@microsoft/clarity';

export default function ClarityScript() {
  useEffect(() => {
    // Get Clarity project ID from environment variable
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    
    if (clarityId && typeof window !== 'undefined') {
      clarity.init(clarityId);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('Microsoft Clarity ID not found. Add NEXT_PUBLIC_CLARITY_ID to your environment variables.');
    }
  }, []);

  return null;
}

