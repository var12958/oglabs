// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Security Service
// ═══════════════════════════════════════════════════════════════════════════════
// Fetches wallet security scan results from the backend API.
//
// GET /api/security/scan?address=0x...&chain=eth
//
// Response contract (from backend source):
// {
//   success: boolean,
//   walletAddress: string,
//   chain: string,
//   score: number (0-100),
//   riskLevel: "Excellent" | "Good" | "Warning" | "Dangerous",
//   totalRisks: number,
//   scannedTokens: number,
//   risks: [{ type, severity, token, description }],
//   recommendations: [string],
//   summary: string,
//   portfolioValueUSD: number,
//   scanTimestamp: string
// }
// ═══════════════════════════════════════════════════════════════════════════════

import { apiGet } from './api';

/**
 * scanWalletSecurity(address, chain)
 * Triggers a security scan for a wallet address on a specific chain.
 */
export async function scanWalletSecurity(address, chain = 'eth') {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  return apiGet('/api/security/scan', { address, chain });
}

/**
 * computeSecurityStats(scanResult)
 * Transforms the raw scan response into UI-friendly structures.
 * Maps backend fields to the shapes expected by Security page components.
 */
export function computeSecurityStats(scanResult) {
  if (!scanResult || !scanResult.success) {
    return null;
  }

  const { score, riskLevel, totalRisks, scannedTokens, risks, recommendations, summary } = scanResult;

  // Map risk level to UI status
  const overallStatus = riskLevel === 'Dangerous' ? 'DANGER' :
    riskLevel === 'Warning' ? 'WARNING' :
    riskLevel === 'Good' ? 'GOOD' : 'SAFE';

  // Categorize risks by severity
  const risksBySeverity = { high: [], medium: [], low: [] };
  (risks || []).forEach((risk) => {
    const key = (risk.severity || 'low').toLowerCase();
    if (risksBySeverity[key]) {
      risksBySeverity[key].push(risk);
    } else {
      risksBySeverity.low.push(risk);
    }
  });

  // Build health score breakdown (derive from risk types present)
  const healthBreakdown = [
    { name: 'Smart Contract Risk', percentage: score >= 90 ? 95 : score >= 70 ? 85 : score >= 50 ? 65 : 40 },
    { name: 'Approval Safety', percentage: risksBySeverity.high.length === 0 ? 90 : 60 },
    { name: 'Token Trust', percentage: risksBySeverity.medium.length <= 1 ? 88 : 70 },
    { name: 'Phishing Risk', percentage: risksBySeverity.high.length === 0 ? 95 : 50 },
  ];

  // Build risk summary cards
  const safeCount = scannedTokens - totalRisks;
  const riskSummaryCards = [
    {
      id: 'safe-assets',
      title: 'Safe Assets',
      value: `${Math.max(0, safeCount)} Tokens`,
      desc: 'Verified standard assets',
      color: 'text-success',
      badgeVariant: 'success',
    },
    {
      id: 'medium-risk',
      title: 'Medium Risk',
      value: `${risksBySeverity.medium.length} Flagged`,
      desc: 'Needs review soon',
      color: 'text-amber-500',
      badgeVariant: 'warning',
    },
    {
      id: 'high-risk',
      title: 'High Risk',
      value: `${risksBySeverity.high.length} Danger`,
      desc: 'Critical action required',
      color: 'text-danger',
      badgeVariant: 'danger',
    },
    {
      id: 'active-approvals',
      title: 'Tokens Scanned',
      value: `${scannedTokens} Tokens`,
      desc: 'Smart contract allowances',
      color: 'text-purple-400',
      badgeVariant: 'primary',
    },
  ];

  // Map risks to detection rows
  const riskDetections = (risks || []).map((risk) => ({
    token: risk.token || 'Unknown',
    riskLevel: risk.severity || 'Low',
    riskVariant: (risk.severity || 'low').toLowerCase() === 'high' ? 'danger' :
      (risk.severity || 'low').toLowerCase() === 'medium' ? 'warning' : 'success',
    issue: risk.description || risk.type,
    chain: risk.chain || '-',
    status: (risk.severity || 'low').toLowerCase() === 'high' ? 'Flagged' :
      (risk.severity || 'low').toLowerCase() === 'medium' ? 'Reviewing' : 'Verified',
    statusVariant: (risk.severity || 'low').toLowerCase() === 'high' ? 'danger' :
      (risk.severity || 'low').toLowerCase() === 'medium' ? 'warning' : 'success',
  }));

  return {
    overallStatus,
    healthScore: score,
    riskLevel,
    totalRisks,
    scannedTokens,
    summary,
    riskSummaryCards,
    healthBreakdown,
    riskDetections,
    recommendations: (recommendations || []).map((text) => ({ text })),
    dangerousWatchlist: risksBySeverity.high.map((risk) => ({
      tokenName: risk.token || 'Unknown Token',
      riskLevel: 'Critical',
      riskVariant: 'danger',
      description: risk.description || risk.type,
    })),
  };
}
