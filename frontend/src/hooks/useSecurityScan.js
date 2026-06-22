// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — useSecurityScan Hook
// ═══════════════════════════════════════════════════════════════════════════════
// Triggers security scans and provides computed security statistics.
// Supports on-demand scanning with loading/error/refresh states.
// Uses WalletContext for address — no hardcoded values.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { scanWalletSecurity, computeSecurityStats } from '../services/securityService';

export default function useSecurityScan(address, chain = 'eth') {
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState(null);
  const mountedRef = useRef(true);

  const runScan = useCallback(async () => {
    if (!address) {
      setError('No wallet address configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await scanWalletSecurity(address, chain);

      if (!mountedRef.current) return;

      if (result.success) {
        setScanResult(result);
        setStats(computeSecurityStats(result));
        setHasScanned(true);
        setScanTimestamp(new Date());
      } else {
        setError(result.error || 'Security scan failed');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to connect to security scanner');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [address, chain]);

  // Auto-scan on mount
  useEffect(() => {
    mountedRef.current = true;
    if (address) {
      runScan();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [runScan, address]);

  const refresh = useCallback(() => {
    runScan();
  }, [runScan]);

  return {
    scanResult,
    stats,
    loading,
    error,
    hasScanned,
    scanTimestamp,
    refresh,
    runScan,
  };
}
