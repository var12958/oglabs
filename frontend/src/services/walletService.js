// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Wallet Service
// ═══════════════════════════════════════════════════════════════════════════════
// Fetches wallet balances from the backend API.
//
// GET /api/wallet/balances?address=0x...&chain=eth
//
// Response contract (from backend source):
// {
//   success: boolean,
//   totalUSD: number,
//   tokens: [{ name, symbol, amount, valueUSD, chain, isNative }],
//   stablecoins: [{ name, symbol, amount, valueUSD, chain }],
//   stablecoinTotalUSD: number
// }
// ═══════════════════════════════════════════════════════════════════════════════

import { apiGet } from './api';

const SUPPORTED_CHAINS = ['eth', 'polygon', 'bsc', 'arbitrum', 'base'];

/**
 * fetchWalletBalances(address, chain)
 * Fetches token balances for a wallet address on a specific chain.
 */
export async function fetchWalletBalances(address, chain = 'eth') {
  if (!address) {
    throw new Error('Wallet address is required');
  }
  if (!SUPPORTED_CHAINS.includes(chain)) {
    throw new Error(`Unsupported chain: ${chain}. Supported: ${SUPPORTED_CHAINS.join(', ')}`);
  }
  return apiGet('/api/wallet/balances', { address, chain });
}

/**
 * fetchAllChainBalances(address)
 * Fetches balances across all supported chains in parallel.
 * Returns an aggregated result with combined tokens and total value.
 */
export async function fetchAllChainBalances(address) {
  if (!address) {
    throw new Error('Wallet address is required');
  }

  const results = await Promise.allSettled(
    SUPPORTED_CHAINS.map((chain) => fetchWalletBalances(address, chain))
  );

  const allTokens = [];
  let totalValueUSD = 0;
  const chainResults = {};

  results.forEach((result, index) => {
    const chain = SUPPORTED_CHAINS[index];
    if (result.status === 'fulfilled' && result.value.success) {
      const data = result.value;
      chainResults[chain] = data;
      if (data.tokens) {
        allTokens.push(...data.tokens);
      }
      totalValueUSD += data.totalUSD || data.totalValueUSD || 0;
    }
  });

  return {
    success: true,
    address,
    tokens: allTokens,
    totalValueUSD: parseFloat(totalValueUSD.toFixed(2)),
    chainResults,
    chainsQueried: SUPPORTED_CHAINS,
    chainsSucceeded: Object.keys(chainResults),
  };
}

/**
 * computePortfolioStats(tokens)
 * Computes derived statistics from a flat token array.
 * Used by Dashboard and Portfolio pages to build summary cards.
 */
export function computePortfolioStats(tokens) {
  if (!tokens || tokens.length === 0) {
    return {
      totalValue: 0,
      totalTokens: 0,
      stablecoinValue: 0,
      stablecoins: [],
      largestHolding: null,
      chainAllocations: {},
      tokenAllocations: [],
    };
  }

  const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'DAI', 'BUSD']);
  const totalValue = tokens.reduce((sum, t) => sum + (t.valueUSD || 0), 0);

  // Stablecoins
  const stablecoins = tokens.filter((t) => STABLECOIN_SYMBOLS.has(t.symbol?.toUpperCase()));
  const stablecoinValue = stablecoins.reduce((sum, t) => sum + (t.valueUSD || 0), 0);

  // Largest holding
  const sorted = [...tokens].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
  const largestHolding = sorted[0] || null;

  // Chain allocations
  const chainAllocations = {};
  tokens.forEach((t) => {
    const chain = t.chain || 'unknown';
    if (!chainAllocations[chain]) {
      chainAllocations[chain] = { value: 0, tokens: 0 };
    }
    chainAllocations[chain].value += t.valueUSD || 0;
    chainAllocations[chain].tokens += 1;
  });

  // Token allocations (with percentages)
  const tokenAllocations = sorted.map((t) => ({
    ...t,
    percentage: totalValue > 0 ? parseFloat(((t.valueUSD / totalValue) * 100).toFixed(1)) : 0,
  }));

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalTokens: tokens.length,
    stablecoinValue: parseFloat(stablecoinValue.toFixed(2)),
    stablecoins,
    largestHolding,
    chainAllocations,
    tokenAllocations,
  };
}
