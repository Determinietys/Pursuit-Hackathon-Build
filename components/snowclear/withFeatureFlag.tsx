'use client';

/**
 * HOC to wrap components with feature flag check
 * ISOLATION: This component is in /components/snowclear/
 */

import { useFeatureFlag } from './useFeatureFlag';

export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: string,
  FallbackComponent?: React.ComponentType
) {
  return function WrappedComponent(props: P) {
    const { enabled, loading } = useFeatureFlag(flag);

    if (loading) return null;
    if (!enabled) return FallbackComponent ? <FallbackComponent /> : null;

    return <Component {...props} />;
  };
}

