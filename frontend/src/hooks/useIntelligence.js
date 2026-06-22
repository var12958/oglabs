// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — useIntelligence Hook
// ═══════════════════════════════════════════════════════════════════════════════
// Manages AI report generation and 0G storage interactions.
// Provides loading/error/refresh states for the Intelligence page.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateAIReport,
  storeOnZeroG,
  fetchZeroGHistory,
  computeIntelligenceStats,
} from '../services/intelligenceService';

export default function useIntelligence() {
  const [history, setHistory] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [aiReport, setAiReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [storing, setStoring] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Fetch 0G history on mount
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchZeroGHistory();
      if (!mountedRef.current) return;
      if (result.success) {
        setHistory(result.reports || []);
        setTotalReports(result.totalReports || 0);
        setStats(computeIntelligenceStats(null, result));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to fetch report history');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchHistory();
    return () => { mountedRef.current = false; };
  }, [fetchHistory]);

  // Generate AI report
  const generate = useCallback(async (securityReport, routeReport) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAIReport(securityReport, routeReport);
      if (!mountedRef.current) return null;
      if (result.success) {
        // Backend returns { success, analysis: string, vaultSenseReport: {...} }
        const reportData = {
          analysis: result.analysis,
          ...result.vaultSenseReport,
        };
        setAiReport(reportData);
        setStats(computeIntelligenceStats(result, { success: true, reports: history, totalReports }));
        return reportData;
      } else {
        setError(result.error || 'AI analysis failed');
        return null;
      }
    } catch (err) {
      if (!mountedRef.current) return null;
      setError(err.message || 'Failed to connect to AI service');
      return null;
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  }, [history, totalReports]);

  // Store report on 0G
  const store = useCallback(async (reportType, walletAddress, data) => {
    setStoring(true);
    setError(null);
    try {
      const result = await storeOnZeroG(reportType, walletAddress, data);
      if (!mountedRef.current) return null;
      if (result.success) {
        // Refresh history after storing
        await fetchHistory();
        return result;
      } else {
        setError(result.error || 'Failed to store on 0G');
        return null;
      }
    } catch (err) {
      if (!mountedRef.current) return null;
      setError(err.message || 'Failed to connect to 0G storage');
      return null;
    } finally {
      if (mountedRef.current) setStoring(false);
    }
  }, [fetchHistory]);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    totalReports,
    aiReport,
    stats,
    loading,
    generating,
    storing,
    error,
    generate,
    store,
    refresh,
  };
}
