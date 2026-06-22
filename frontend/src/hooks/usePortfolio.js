// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — usePortfolio Hook
// ═══════════════════════════════════════════════════════════════════════════════
// Fetches wallet balances across all chains and computes portfolio statistics.
// Provides loading, error, and refresh states for Dashboard and Portfolio pages.
// Uses WalletContext for address — no hardcoded values.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllChainBalances, computePortfolioStats } from '../services/walletService';

export default function usePortfolio(address) {
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalValueUSD, setTotalValueUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!address) {
      setError('No wallet address configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchAllChainBalances(address);

      if (!mountedRef.current) return;

      if (result.success) {
        setTokens(result.tokens);
        setTotalValueUSD(result.totalValueUSD);
        setStats(computePortfolioStats(result.tokens));
        setLastFetched(new Date());
      } else {
        setError('Failed to fetch balances');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to connect to backend');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [address]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    tokens,
    stats,
    totalValueUSD,
    loading,
    error,
    refresh,
    lastFetched,
  };
}
