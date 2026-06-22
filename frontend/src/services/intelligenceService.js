// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Intelligence Service
// ═══════════════════════════════════════════════════════════════════════════════
// Manages AI analysis reports and 0G storage interactions.
//
// POST /api/ai/analyze    — Generate AI report from security + route data
// POST /api/0g/store      — Store a report on 0G decentralized storage
// GET  /api/0g/fetch       — List history or fetch specific report by rootHash
//
// Response contracts (from backend source):
//
// /api/ai/analyze:
//   { success, report: { analysis, summary, riskAssessment, routeRecommendation, recommendations, generatedAt } }
//
// /api/0g/store:
//   { success, rootHash, txHash, explorerUrl, report }
//
// /api/0g/fetch (no rootHash):
//   { success, totalReports, reports: [{ rootHash, txHash, reportType, walletAddress, timestamp }] }
//
// /api/0g/fetch?rootHash=...:
//   { success, report: { reportType, walletAddress, data, timestamp, network } }
// ═══════════════════════════════════════════════════════════════════════════════

import { apiGet, apiPost } from './api';

/**
 * generateAIReport(securityReport, routeReport)
 * Sends security and route data to the AI backend for analysis.
 */
export async function generateAIReport(securityReport, routeReport) {
  return apiPost('/api/ai/analyze', {
    securityReport: securityReport || null,
    routeReport: routeReport || null,
  });
}

/**
 * storeOnZeroG(reportType, walletAddress, data)
 * Stores a report on 0G decentralized storage.
 */
export async function storeOnZeroG(reportType, walletAddress, data) {
  if (!reportType || !walletAddress || !data) {
    throw new Error('reportType, walletAddress, and data are required');
  }
  return apiPost('/api/0g/store', { reportType, walletAddress, data });
}

/**
 * fetchZeroGHistory()
 * Fetches the list of all reports stored on 0G.
 */
export async function fetchZeroGHistory() {
  return apiGet('/api/0g/fetch');
}

/**
 * fetchZeroGReport(rootHash)
 * Fetches a specific report from 0G storage by its root hash.
 */
export async function fetchZeroGReport(rootHash) {
  if (!rootHash) {
    throw new Error('rootHash is required');
  }
  return apiGet('/api/0g/fetch', { rootHash });
}

/**
 * computeIntelligenceStats(aiResult, historyResult)
 * Transforms AI and 0G history responses into UI-friendly structures
 * for the Intelligence page components.
 */
export function computeIntelligenceStats(aiResult, historyResult) {
  const reports = historyResult?.success ? historyResult.reports : [];
  const totalReports = historyResult?.success ? historyResult.totalReports : 0;

  // Build statistics cards from real data
  const statistics = [
    { id: 'stored', title: 'Reports Stored', value: totalReports, suffix: '', subtext: 'Secured on 0G Storage' },
    { id: 'ai', title: 'AI Analysis', value: aiResult?.success ? 'Active' : 'Ready', suffix: '', subtext: 'Gemini 2.5 Flash' },
    { id: 'network', title: 'Network', value: '0G', suffix: ' Testnet', subtext: 'Newton decentralized storage' },
    { id: 'status', title: 'Status', value: 'Online', suffix: '', subtext: 'All systems operational' },
  ];

  // Build recent reports from 0G history
  const recentReports = reports.slice(0, 10).map((r, index) => ({
    id: r.rootHash || `report-${index}`,
    name: `${formatReportType(r.reportType)} Report`,
    category: mapReportCategory(r.reportType),
    created: r.timestamp ? new Date(r.timestamp).toLocaleString() : 'Unknown',
    storageStatus: 'Stored on 0G',
    hash: r.rootHash || '-',
    txHash: r.txHash || '-',
    walletAddress: r.walletAddress || '-',
  }));

  return {
    statistics,
    recentReports,
    aiReport: aiResult?.success ? aiResult.report : null,
    totalReports,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatReportType(type) {
  if (!type) return 'General';
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
}

function mapReportCategory(type) {
  if (!type) return 'General';
  const lower = type.toLowerCase();
  if (lower.includes('security') || lower.includes('scan')) return 'Security';
  if (lower.includes('route') || lower.includes('swap')) return 'Routing';
  if (lower.includes('threat') || lower.includes('risk')) return 'Threat Detection';
  return 'Intelligence';
}
