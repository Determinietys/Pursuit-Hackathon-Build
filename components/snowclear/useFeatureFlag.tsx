'use client';

/**
 * React hook for client-side feature flag checking
 * ISOLATION: This component is in /components/snowclear/
 */

import { useState, useEffect } from 'react';

export function useFeatureFlag(flag: string): {
  enabled: boolean;
  loading: boolean;
} {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/snowclear/flags?flag=${flag}`)
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled);
        setLoading(false);
      })
      .catch(() => {
        setEnabled(false);
        setLoading(false);
      });
  }, [flag]);

  return { enabled, loading };
}

