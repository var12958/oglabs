// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Smart Route Optimizer API
// ═══════════════════════════════════════════════════════════════════════════════
// Finds the best chain to execute a token swap by comparing quotes across
// Ethereum, Base, and Arbitrum via the Li.Fi aggregator.
//
// Usage: GET /api/routes/best?fromToken=ETH&toToken=USDC&amount=1
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFI_BASE_URL = "https://li.quest/v1";
const PER_CHAIN_TIMEOUT = 12000;

const CHAINS = [
  { id: 1,     key: "ethereum", name: "Ethereum",  avgBlockTime: 12 },
  { id: 8453,  key: "base",     name: "Base",      avgBlockTime: 2  },
  { id: 42161, key: "arbitrum", name: "Arbitrum",  avgBlockTime: 0.25 },
];

const TOKEN_MAP = {
  ETH:  "0x0000000000000000000000000000000000000000",
  USDC: {
    1:     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    8453:  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  },
  USDT: {
    1:     "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    8453:  "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  },
  DAI: {
    1:     "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    8453:  "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
  WETH: {
    1:     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    8453:  "0x4200000000000000000000000000000000000006",
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
};

const TOKEN_DECIMALS = {
  ETH: 18, WETH: 18, USDC: 6, USDT: 6, DAI: 18,
};

const WEIGHTS = {
  output:      0.50,
  gas:         0.25,
  complexity:  0.15,
  speed:       0.10,
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { fromToken, toToken, amount } = req.query;

    const validationError = validateInputs(fromToken, toToken, amount);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const fromSymbol = fromToken.toUpperCase();
    const toSymbol = toToken.toUpperCase();
    const parsedAmount = parseFloat(amount);

    // Fetch quotes sequentially to avoid EPIPE crashes in dev server
    const quotes = await fetchQuotes(fromSymbol, toSymbol, parsedAmount);

    if (quotes.length === 0) {
      return res.status(502).json({
        success: false,
        error: "Failed to fetch quotes from any chain. All Li.Fi requests failed.",
      });
    }

    const normalizedRoutes = quotes.map(normalizeQuote);

    const scoredRoutes = normalizedRoutes.map((route) => ({
      ...route,
      score: calculateRouteScore(route, normalizedRoutes),
    }));

    scoredRoutes.sort((a, b) => b.score - a.score);
    const bestRoute = scoredRoutes[0];

    const worstOutput = Math.min(...scoredRoutes.map((r) => r.outputAmount));
    const gainPercent = worstOutput > 0
      ? parseFloat((((bestRoute.outputAmount - worstOutput) / worstOutput) * 100).toFixed(2))
      : 0;

    const estimatedSavingsUSD = calculateSavings(scoredRoutes);
    const explanation = generateRouteExplanation(bestRoute, scoredRoutes, gainPercent, estimatedSavingsUSD);

    const routeReport = {
      bestChain: bestRoute.chain,
      fromToken: fromSymbol,
      toToken: toSymbol,
      inputAmount: parsedAmount,
      gainPercent,
      estimatedSavingsUSD,
      routesAnalyzed: scoredRoutes.length,
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      bestChain: bestRoute.chain,
      bestRoute,
      gainPercent,
      estimatedSavingsUSD,
      routes: scoredRoutes,
      explanation,
      routeReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error during route optimization.",
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateInputs(fromToken, toToken, amount) {
  if (!fromToken) return "Missing required query parameter: fromToken";
  if (!toToken) return "Missing required query parameter: toToken";
  if (!amount) return "Missing required query parameter: amount";

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return "Invalid amount: must be a positive number";
  }

  const fromSymbol = fromToken.toUpperCase();
  const toSymbol = toToken.toUpperCase();

  if (!TOKEN_MAP[fromSymbol]) {
    return `Unsupported fromToken: ${fromToken}. Supported: ${Object.keys(TOKEN_MAP).join(", ")}`;
  }
  if (!TOKEN_MAP[toSymbol]) {
    return `Unsupported toToken: ${toToken}. Supported: ${Object.keys(TOKEN_MAP).join(", ")}`;
  }
  if (fromSymbol === toSymbol) {
    return "fromToken and toToken must be different";
  }

  return null;
}

function resolveTokenAddress(symbol, chainId) {
  const entry = TOKEN_MAP[symbol];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry[chainId] || null;
}

// ─── Fetch Quotes (Sequential) ────────────────────────────────────────────────

async function fetchQuotes(fromSymbol, toSymbol, amount) {
  const decimals = TOKEN_DECIMALS[fromSymbol] || 18;
  const fromAmount = BigInt(Math.round(amount * Math.pow(10, decimals))).toString();
  const DEFAULT_QUOTE_ADDRESS = "0x000000000000000000000000000000000000dEaD";

  const results = [];

  for (const chain of CHAINS) {
    const quote = await fetchSingleQuote(chain, fromSymbol, toSymbol, fromAmount, DEFAULT_QUOTE_ADDRESS);
    if (quote) results.push(quote);
  }

  return results;
}

async function fetchSingleQuote(chain, fromSymbol, toSymbol, fromAmount, defaultAddr) {
  try {
    const fromTokenAddr = resolveTokenAddress(fromSymbol, chain.id);
    const toTokenAddr = resolveTokenAddress(toSymbol, chain.id);

    if (!fromTokenAddr || !toTokenAddr) return null;

    const params = new URLSearchParams({
      fromChain: String(chain.id),
      toChain: String(chain.id),
      fromToken: fromTokenAddr,
      toToken: toTokenAddr,
      fromAmount,
      fromAddress: defaultAddr,
      order: "CHEAPEST",
    });

    const url = `${LIFI_BASE_URL}/quote?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, PER_CHAIN_TIMEOUT);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const data = await response.json();
    return { chain: chain.key, chainId: chain.id, quote: data };
  } catch (err) {
    return null;
  }
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalizeQuote({ chain, chainId, quote }) {
  const toDecimals = TOKEN_DECIMALS[quote.action?.toToken?.symbol] || 18;
  const outputAmountRaw = quote.estimate?.toAmount || "0";
  const outputAmount = parseFloat(outputAmountRaw) / Math.pow(10, toDecimals);

  const gasCosts = quote.estimate?.gasCosts || [];
  const gasCostUSD = gasCosts.reduce((sum, g) => sum + (parseFloat(g.amountUSD) || 0), 0);

  const includedSteps = quote.includedSteps || [];
  const routeSteps = Math.max(includedSteps.length, 1);

  const estimatedTime = quote.estimate?.executionDuration
    ? Math.round(quote.estimate.executionDuration)
    : Math.round((CHAINS.find((c) => c.id === chainId)?.avgBlockTime || 5) * routeSteps * 60) || 30;

  return {
    chain,
    outputAmount: parseFloat(outputAmount.toFixed(6)),
    gasCostUSD: parseFloat(gasCostUSD.toFixed(2)),
    routeSteps,
    estimatedTime,
  };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calculateRouteScore(route, allRoutes) {
  if (allRoutes.length === 0) return 0;

  const outputs = allRoutes.map((r) => r.outputAmount);
  const gasCosts = allRoutes.map((r) => r.gasCostUSD);
  const steps = allRoutes.map((r) => r.routeSteps);
  const times = allRoutes.map((r) => r.estimatedTime);

  const maxOutput = Math.max(...outputs);
  const minOutput = Math.min(...outputs);
  const maxGas = Math.max(...gasCosts);
  const minGas = Math.min(...gasCosts);
  const maxSteps = Math.max(...steps);
  const minSteps = Math.min(...steps);
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  const outputScore = maxOutput > minOutput
    ? ((route.outputAmount - minOutput) / (maxOutput - minOutput)) * 100 : 50;
  const gasScore = maxGas > minGas
    ? ((maxGas - route.gasCostUSD) / (maxGas - minGas)) * 100 : 50;
  const complexityScore = maxSteps > minSteps
    ? ((maxSteps - route.routeSteps) / (maxSteps - minSteps)) * 100 : 50;
  const speedScore = maxTime > minTime
    ? ((maxTime - route.estimatedTime) / (maxTime - minTime)) * 100 : 50;

  const rawScore =
    outputScore * WEIGHTS.output +
    gasScore * WEIGHTS.gas +
    complexityScore * WEIGHTS.complexity +
    speedScore * WEIGHTS.speed;

  return Math.round(Math.min(100, Math.max(0, rawScore)));
}

// ─── Savings ──────────────────────────────────────────────────────────────────

function calculateSavings(routes) {
  if (routes.length < 2) return 0;
  const bestRoute = routes[0];
  const worstRoute = routes[routes.length - 1];
  const outputDiff = bestRoute.outputAmount - worstRoute.outputAmount;
  return outputDiff > 0 ? parseFloat(outputDiff.toFixed(6)) : 0;
}

// ─── Explanation ──────────────────────────────────────────────────────────────

function generateRouteExplanation(bestRoute, allRoutes, gainPercent, estimatedSavings) {
  const parts = [];
  const chainName = bestRoute.chain.charAt(0).toUpperCase() + bestRoute.chain.slice(1);

  if (allRoutes.length === 1) {
    parts.push(
      `${chainName} is the only available route for this swap. ` +
      `Expected output: ${bestRoute.outputAmount} with estimated gas cost of $${bestRoute.gasCostUSD}.`
    );
    return parts.join(" ");
  }

  const gasAdvantage = (allRoutes[allRoutes.length - 1].gasCostUSD - bestRoute.gasCostUSD).toFixed(2);

  parts.push(`${chainName} provides the best execution route for this swap.`);

  if (gainPercent > 0) {
    parts.push(`This route is expected to return ${gainPercent}% more value than the least efficient option.`);
  }

  if (parseFloat(gasAdvantage) > 0) {
    parts.push(`Gas costs are approximately $${gasAdvantage} lower than the most expensive alternative.`);
  }

  if (bestRoute.estimatedTime <= 15) {
    parts.push(`Transaction confirmation is expected within ${bestRoute.estimatedTime} seconds.`);
  } else {
    parts.push(`Estimated execution time: ${bestRoute.estimatedTime} seconds.`);
  }

  if (estimatedSavings > 0 && gainPercent > 0) {
    parts.push(`Estimated additional value compared to the worst route: ~${estimatedSavings.toFixed(6)} output tokens.`);
  }

  if (bestRoute.routeSteps === 1) {
    parts.push(`This is a direct single-hop swap with minimal complexity risk.`);
  } else {
    parts.push(`Route involves ${bestRoute.routeSteps} steps for optimal output.`);
  }

  return parts.join(" ");
}
