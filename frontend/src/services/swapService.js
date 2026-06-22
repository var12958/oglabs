// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Swap Service
// ═══════════════════════════════════════════════════════════════════════════════
// Fetches optimal swap routes from the backend API.
//
// GET /api/routes/best?fromToken=USDC&toToken=ETH&amount=1000
//
// Response contract (from backend source):
// {
//   success: boolean,
//   bestChain: string,
//   bestRoute: { chain, chainId, fromToken, toToken, inputAmount, outputAmount, gasCostUSD, totalCostUSD, estimatedTimeSeconds, score, tool },
//   gainPercent: number,
//   estimatedSavingsUSD: number,
//   routes: [{ chain, chainId, outputAmount, gasCostUSD, totalCostUSD, estimatedTimeSeconds, score, tool }],
//   explanation: string,
//   routeReport: { bestChain, fromToken, toToken, inputAmount, gainPercent, estimatedSavingsUSD, routesAnalyzed, generatedAt }
// }
// ═══════════════════════════════════════════════════════════════════════════════

import { apiGet } from './api';

/**
 * findBestRoute(fromToken, toToken, amount)
 * Queries the backend for the best swap route across all supported chains.
 */
export async function findBestRoute(fromToken, toToken, amount) {
  if (!fromToken || !toToken) {
    throw new Error('Source and destination tokens are required');
  }
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new Error('A valid positive amount is required');
  }
  return apiGet('/api/routes/best', {
    fromToken,
    toToken,
    amount: parseFloat(amount),
  });
}

/**
 * computeSwapStats(routeResult)
 * Transforms the raw route response into UI-friendly structures
 * for the SmartSwap page components.
 */
export function computeSwapStats(routeResult) {
  if (!routeResult || !routeResult.success) {
    return null;
  }

  // Backend returns: routes, gainPercent, estimatedSavingsUSD, bestChain, bestRoute, explanation, routeReport
  const { bestRoute, routes, gainPercent, estimatedSavingsUSD, bestChain, explanation, routeReport } = routeResult;
  const fromToken = routeReport?.fromToken || routeResult.fromToken || '';
  const toToken = routeReport?.toToken || routeResult.toToken || '';
  const inputAmount = routeReport?.inputAmount || routeResult.inputAmount || 0;

  // Map all routes to the UI card format
  const routeCards = (routes || []).map((route) => {
    const isBest = route.chain === bestRoute?.chain;
    return {
      id: route.chain,
      name: capitalizeChain(route.chain),
      outputAmount: route.outputAmountFormatted || `${route.outputAmount} ${toToken}`,
      outputValue: route.outputAmount,
      gasFee: `$${(route.gasCostUSD || 0).toFixed(2)}`,
      bridgeFee: '$0.00',
      platformFee: '$0.00',
      totalFee: `$${(route.totalCostUSD || 0).toFixed(2)}`,
      estimatedTime: formatTime(route.estimatedTimeSeconds),
      safetyScore: Math.min(98, Math.round((route.score || 0) * 10 + 80)),
      badge: isBest ? 'Best Route' : null,
      badgeVariant: isBest ? 'success' : null,
      score: route.score || 0,
    };
  });

  // Sort by score descending (best first)
  routeCards.sort((a, b) => b.score - a.score);

  // Mark the best
  if (routeCards.length > 0 && !routeCards.some((r) => r.badge)) {
    routeCards[0].badge = 'Best Route';
    routeCards[0].badgeVariant = 'success';
  }

  return {
    bestRoute,
    routeCards,
    savings: {
      bestChain: capitalizeChain(bestChain || bestRoute?.chain),
      gainPercent: gainPercent || 0,
      estimatedSavingsUSD: estimatedSavingsUSD || 0,
      routesAnalyzed: routes?.length || 0,
    },
    inputAmount,
    fromToken,
    toToken,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalizeChain(chain) {
  if (!chain) return 'Unknown';
  return chain.charAt(0).toUpperCase() + chain.slice(1);
}

function formatTime(seconds) {
  if (!seconds) return '~5s';
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  return `~${Math.round(seconds / 60)}m`;
}
