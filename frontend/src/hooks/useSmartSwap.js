// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — useSmartSwap Hook
// ═══════════════════════════════════════════════════════════════════════════════
// Manages swap route calculations via the backend API.
// Provides on-demand route finding with loading/error/refresh states.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import { findBestRoute, computeSwapStats } from '../services/swapService';

export default function useSmartSwap() {
  const [routeResult, setRouteResult] = useState(null);
  const [swapStats, setSwapStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const findRoutes = useCallback(async (fromToken, toToken, amount) => {
    if (!fromToken || !toToken || !amount) {
      setError('Please select tokens and enter an amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await findBestRoute(fromToken, toToken, amount);

      if (!mountedRef.current) return;

      if (result.success) {
        setRouteResult(result);
        setSwapStats(computeSwapStats(result));
      } else {
        setError(result.error || 'Failed to find routes');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to connect to route optimizer');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback((fromToken, toToken, amount) => {
    findRoutes(fromToken, toToken, amount);
  }, [findRoutes]);

  const clearRoutes = useCallback(() => {
    setRouteResult(null);
    setSwapStats(null);
    setError(null);
  }, []);

  return {
    routeResult,
    swapStats,
    loading,
    error,
    findRoutes,
    refresh,
    clearRoutes,
  };
}
