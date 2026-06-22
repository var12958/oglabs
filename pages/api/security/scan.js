import axios from "axios";

// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Wallet Security Scanner API
// ═══════════════════════════════════════════════════════════════════════════════
// Scans a wallet address for security risks using GoPlus Security API.
// Fetches balances internally via Moralis, then analyzes each token.
// Returns a health score, risk breakdown, recommendations, and summary.
//
// Usage: GET /api/security/scan?address=0x...&chain=eth
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Environment Variables ────────────────────────────────────────────────────

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const GOPLUS_API_KEY = process.env.GOPLUS_API_KEY;
const MORALIS_BASE_URL = "https://deep-index.moralis.io/api/v2.2";
const GOPLUS_BASE_URL = "https://api.gopluslabs.io/api/v1";

// ─── Chain Configuration ──────────────────────────────────────────────────────
// GoPlus uses numeric chain IDs; Moralis uses short names. We map both.

const CHAIN_ID_MAP = {
  eth: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  base: "8453",
};

const SUPPORTED_CHAINS = ["eth", "polygon", "bsc", "arbitrum", "base"];

// Native token metadata per chain (Moralis doesn't return native tokens in ERC-20 endpoint)
const NATIVE_TOKEN_META = {
  eth: { name: "Ethereum", symbol: "ETH" },
  polygon: { name: "Polygon", symbol: "POL" },
  bsc: { name: "BNB Smart Chain", symbol: "BNB" },
  arbitrum: { name: "Arbitrum", symbol: "ETH" },
  base: { name: "Base", symbol: "ETH" },
};

// ─── Scoring Constants ────────────────────────────────────────────────────────
// Score starts at 100. Each risk deducts points. Final score is clamped to 0-100.

const SCORE_PENALTIES = {
  HONEYPOT: -30,
  BLACKLISTED: -25,
  HIDDEN_OWNER: -15,
  CAN_RECLAIM_OWNERSHIP: -15,
  HIGH_TAX: -10,           // buy or sell tax > 20%
  NOT_OPEN_SOURCE: -5,
  DUST_TOKEN: -2,          // per dust token, capped at -10
  DUST_TOKEN_MAX: -10,
  CONCENTRATION_70: -10,   // single token > 70% of portfolio
  CONCENTRATION_90: -20,   // single token > 90% of portfolio
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates an Ethereum wallet address format.
 * Must be a 42-character hex string starting with "0x".
 */
function isValidAddress(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Clamps a numeric score to the 0-100 range and rounds it.
 */
function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Maps a numeric score to a human-readable risk level.
 *   90-100 = Excellent
 *   70-89  = Good
 *   50-69  = Warning
 *   0-49   = Dangerous
 */
function determineRiskLevel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Warning";
  return "Dangerous";
}

/**
 * Calculates the final security score from an array of penalty values.
 * Starts at 100 and subtracts all penalties, then clamps to 0-100.
 */
function calculateScore(penalties) {
  const totalPenalty = penalties.reduce((sum, p) => sum + p, 0);
  return clampScore(100 + totalPenalty);
}

/**
 * Maps GoPlus "1"/"0" string values to boolean.
 * GoPlus returns "1" for true and "0" for false.
 */
function isFlagged(value) {
  return value === "1" || value === 1;
}

/**
 * Parses a GoPlus tax value (decimal string) into a percentage number.
 * GoPlus returns 0.05 for 5%, so we multiply by 100.
 */
function parseTax(value) {
  if (!value || value === "") return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num * 100;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * fetchWalletBalances(address, chain)
 * ─────────────────────────────────────
 * Fetches all token balances for a wallet using Moralis.
 * Returns a normalized array of token objects with USD values.
 * Includes both native tokens and ERC-20 tokens.
 */
async function fetchWalletBalances(address, chain) {
  // Fetch ERC-20 token balances, native balance, and native price in parallel
  const nativeTokenAddresses = {
    eth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    bsc: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    base: "0x4200000000000000000000000000000000000006",
  };

  const [tokenBalancesRes, nativeBalanceRes, priceRes] = await Promise.all([
    axios.get(`${MORALIS_BASE_URL}/${address}/erc20`, {
      params: { chain },
      headers: { "X-API-Key": MORALIS_API_KEY },
      timeout: 15000,
    }),
    axios.get(`${MORALIS_BASE_URL}/${address}/balance`, {
      params: { chain },
      headers: { "X-API-Key": MORALIS_API_KEY },
      timeout: 10000,
    }),
    axios.post(
      `${MORALIS_BASE_URL}/erc20/prices`,
      { tokens: [{ token_address: nativeTokenAddresses[chain] }] },
      { params: { chain }, headers: { "X-API-Key": MORALIS_API_KEY }, timeout: 10000 }
    ).catch(() => ({ data: [] })),
  ]);

  const nativePriceUSD = parseFloat(priceRes.data?.[0]?.usdPrice) || 0;

  const tokens = [];

  // Process native token balance (ETH, BNB, MATIC, etc.)
  const nativeBalance = nativeBalanceRes.data?.balance || "0";
  const nativeDecimals = 18;
  const nativeAmount = parseFloat(nativeBalance) / Math.pow(10, nativeDecimals);
  const nativeMeta = NATIVE_TOKEN_META[chain] || { name: chain, symbol: chain.toUpperCase() };

  if (nativeAmount > 0) {
    tokens.push({
      name: nativeMeta.name,
      symbol: nativeMeta.symbol,
      token_address: null,
      amount: parseFloat(nativeAmount.toFixed(6)),
      valueUSD: parseFloat((nativeAmount * nativePriceUSD).toFixed(2)),
      chain,
      isNative: true,
    });
  }

  // Process ERC-20 tokens
  const erc20Tokens = (tokenBalancesRes.data || []).map((token) => {
    const decimals = parseInt(token.decimals, 10) || 18;
    const amount = parseFloat(token.balance) / Math.pow(10, decimals);
    const usdPrice = parseFloat(token.usd_price) || 0;
    const valueUSD = parseFloat(token.usd_value) || amount * usdPrice;

    return {
      name: token.name || "Unknown",
      symbol: token.symbol || "???",
      token_address: token.token_address || null,
      amount: parseFloat(amount.toFixed(6)),
      valueUSD: parseFloat(valueUSD.toFixed(2)),
      chain,
      isNative: false,
    };
  });

  tokens.push(...erc20Tokens);

  // Sort by USD value descending (highest value first)
  tokens.sort((a, b) => b.valueUSD - a.valueUSD);

  return tokens;
}

/**
 * scanTokenWithGoPlus(token, chainId)
 * ────────────────────────────────────
 * Scans a single token contract against GoPlus Security API.
 * Checks for honeypot, blacklist, hidden owner, ownership reclaim,
 * balance manipulation, proxy, buy/sell tax, and open source status.
 * Returns { risks: [], penalties: [] } for this token.
 *
 * Gracefully handles: missing API key, GoPlus unavailable, token not found.
 * Never throws — always returns a result.
 */
async function scanTokenWithGoPlus(token, chainId) {
  const risks = [];
  const penalties = [];

  // Native tokens (ETH, BNB, etc.) don't have contract addresses to scan
  if (token.isNative) {
    return { risks, penalties };
  }

  // We need a contract address to query GoPlus
  const contractAddress = token.token_address || token.contractAddress;
  if (!contractAddress) {
    return { risks, penalties };
  }

  try {
    // Build GoPlus API params — API key is optional (higher rate limits with key)
    const params = { contract_addresses: contractAddress.toLowerCase() };
    if (GOPLUS_API_KEY) {
      params.api_key = GOPLUS_API_KEY;
    }

    const response = await axios.get(
      `${GOPLUS_BASE_URL}/token_security/${chainId}`,
      { params, timeout: 10000 }
    );

    // GoPlus returns results keyed by lowercase contract address
    const result = response.data?.result?.[contractAddress.toLowerCase()];
    if (!result) {
      // No data returned — token may be very new or unknown to GoPlus
      return { risks, penalties };
    }

    const tokenName = token.symbol || token.name || contractAddress.slice(0, 10);

    // ── Check 1: Honeypot ──────────────────────────────────────────────
    // A honeypot lets you buy but prevents selling. Most dangerous scam type.
    if (isFlagged(result.is_honeypot)) {
      risks.push({
        type: "Honeypot",
        token: tokenName,
        severity: "Critical",
        description: "Token may not be sellable. This is a common scam pattern.",
      });
      penalties.push(SCORE_PENALTIES.HONEYPOT);
    }

    // ── Check 2: Blacklisted ───────────────────────────────────────────
    // Contract has blacklist functionality — owner can freeze any wallet.
    if (isFlagged(result.is_blacklisted)) {
      risks.push({
        type: "Blacklisted",
        token: tokenName,
        severity: "High",
        description: "Token contract has blacklist functionality. Owner can freeze wallets.",
      });
      penalties.push(SCORE_PENALTIES.BLACKLISTED);
    }

    // ── Check 3: Hidden Owner ──────────────────────────────────────────
    // Ownership is hidden — cannot verify who controls the token.
    if (isFlagged(result.hidden_owner)) {
      risks.push({
        type: "Hidden Owner",
        token: tokenName,
        severity: "High",
        description: "Contract ownership is hidden. Cannot verify who controls this token.",
      });
      penalties.push(SCORE_PENALTIES.HIDDEN_OWNER);
    }

    // ── Check 4: Ownership Reclaimable ─────────────────────────────────
    // Previous owner can reclaim ownership after renouncing.
    if (isFlagged(result.can_take_back_ownership)) {
      risks.push({
        type: "Reclaimable Ownership",
        token: tokenName,
        severity: "High",
        description: "Previous owner can reclaim ownership after renouncing. Trust risk.",
      });
      penalties.push(SCORE_PENALTIES.CAN_RECLAIM_OWNERSHIP);
    }

    // ── Check 5: Owner Can Change Balance ──────────────────────────────
    // Owner can arbitrarily modify any wallet's token balance.
    if (isFlagged(result.owner_change_balance)) {
      risks.push({
        type: "Balance Manipulation",
        token: tokenName,
        severity: "High",
        description: "Contract owner can arbitrarily change token balances.",
      });
    }

    // ── Check 6: Proxy Contract ────────────────────────────────────────
    // Proxy contracts can be upgraded to change token behavior.
    if (isFlagged(result.is_proxy)) {
      risks.push({
        type: "Proxy Contract",
        token: tokenName,
        severity: "Medium",
        description: "Token uses a proxy contract. Logic can be upgraded by the owner.",
      });
    }

    // ── Check 7: Buy Tax > 20% ────────────────────────────────────────
    const buyTax = parseTax(result.buy_tax);
    if (buyTax > 20) {
      risks.push({
        type: "High Buy Tax",
        token: tokenName,
        severity: "Medium",
        description: `Buy tax is ${buyTax.toFixed(1)}%. You lose a significant portion when buying.`,
      });
      penalties.push(SCORE_PENALTIES.HIGH_TAX);
    }

    // ── Check 8: Sell Tax > 20% ───────────────────────────────────────
    const sellTax = parseTax(result.sell_tax);
    if (sellTax > 20) {
      risks.push({
        type: "High Sell Tax",
        token: tokenName,
        severity: "Medium",
        description: `Sell tax is ${sellTax.toFixed(1)}%. You lose a significant portion when selling.`,
      });
      // Only add penalty if buy tax didn't already trigger it
      if (buyTax <= 20) {
        penalties.push(SCORE_PENALTIES.HIGH_TAX);
      }
    }

    // ── Check 9: Not Open Source ───────────────────────────────────────
    // Closed-source contracts cannot be independently audited.
    if (!isFlagged(result.is_open_source)) {
      risks.push({
        type: "Closed Source",
        token: tokenName,
        severity: "Low",
        description: "Contract source code is not verified. Cannot be independently audited.",
      });
      penalties.push(SCORE_PENALTIES.NOT_OPEN_SOURCE);
    }
  } catch (error) {
    // FIX 3: Never crash the entire scan if one token lookup fails.
    // GoPlus may be unavailable or the token may not exist in their database.
  }

  return { risks, penalties };
}

/**
 * analyzeDustTokens(tokens)
 * ──────────────────────────
 * Detects dust tokens — tiny-value tokens often sent as spam or used
 * in dust attacks to track wallet activity. Max penalty capped at -10.
 */
function analyzeDustTokens(tokens) {
  const risks = [];
  let dustPenalty = 0;

  // Dust tokens have a value between $0 and $1 (exclusive)
  const dustTokens = tokens.filter((t) => t.valueUSD > 0 && t.valueUSD < 1);

  for (const token of dustTokens) {
    risks.push({
      type: "Dust Token",
      token: token.symbol || token.name || "Unknown",
      severity: "Low",
      description: `Token value is only $${token.valueUSD.toFixed(4)}. May be spam or a dust attack token.`,
    });
    dustPenalty += SCORE_PENALTIES.DUST_TOKEN;
  }

  // Cap dust penalty at -10 points maximum
  const cappedPenalty = Math.max(dustPenalty, SCORE_PENALTIES.DUST_TOKEN_MAX);

  return {
    risks,
    penalties: dustTokens.length > 0 ? [cappedPenalty] : [],
    dustCount: dustTokens.length,
  };
}

/**
 * analyzeConcentration(tokens, totalValue)
 * ──────────────────────────────────────────
 * Checks if a single token dominates the portfolio.
 * >70% = -10 points, >90% = -20 points.
 */
function analyzeConcentration(tokens, totalValue) {
  const risks = [];
  const penalties = [];

  // Skip if portfolio is empty or has only one token
  if (totalValue <= 0 || tokens.length <= 1) {
    return { risks, penalties };
  }

  // Find the token with the highest USD value
  const sorted = [...tokens].sort((a, b) => b.valueUSD - a.valueUSD);
  const dominant = sorted[0];
  const dominancePercent = (dominant.valueUSD / totalValue) * 100;

  if (dominancePercent > 90) {
    risks.push({
      type: "Concentration Risk",
      token: dominant.symbol || dominant.name || "Unknown",
      severity: "High",
      description: `${dominancePercent.toFixed(1)}% of portfolio is in one token. Extremely concentrated.`,
    });
    penalties.push(SCORE_PENALTIES.CONCENTRATION_90);
  } else if (dominancePercent > 70) {
    risks.push({
      type: "Concentration Risk",
      token: dominant.symbol || dominant.name || "Unknown",
      severity: "Medium",
      description: `${dominancePercent.toFixed(1)}% of portfolio is in one token. Consider diversifying.`,
    });
    penalties.push(SCORE_PENALTIES.CONCENTRATION_70);
  }

  return {
    risks,
    penalties,
    dominantToken: dominant.symbol,
    dominancePercent,
  };
}

/**
 * generateRecommendations(risks, dustCount, concentrationInfo)
 * ─────────────────────────────────────────────────────────────
 * Generates actionable security recommendations based on detected risks.
 */
function generateRecommendations(risks, dustCount, concentrationInfo) {
  const recommendations = [];

  // Honeypot warning
  if (risks.some((r) => r.type === "Honeypot")) {
    recommendations.push("Avoid interacting with honeypot tokens. You may not be able to sell them.");
  }

  // Blacklist warning
  if (risks.some((r) => r.type === "Blacklisted")) {
    recommendations.push("Avoid holding tokens with blacklist functionality. Your wallet could be frozen.");
  }

  // Ownership risks
  if (risks.some((r) => r.type === "Hidden Owner" || r.type === "Reclaimable Ownership")) {
    recommendations.push("Revoke approvals for suspicious contracts with hidden or reclaimable ownership.");
  }

  // Balance manipulation
  if (risks.some((r) => r.type === "Balance Manipulation")) {
    recommendations.push("Exit positions in tokens where the owner can change balances arbitrarily.");
  }

  // Proxy contracts
  if (risks.some((r) => r.type === "Proxy Contract")) {
    recommendations.push("Monitor proxy contract tokens closely. Their logic can change at any time.");
  }

  // High tax
  if (risks.some((r) => r.type === "High Buy Tax" || r.type === "High Sell Tax")) {
    recommendations.push("Be cautious with high-tax tokens. Factor in tax costs before trading.");
  }

  // Closed source
  if (risks.some((r) => r.type === "Closed Source")) {
    recommendations.push("Prefer open-source tokens that can be independently verified.");
  }

  // Dust tokens
  if (dustCount > 0) {
    recommendations.push("Consider ignoring or hiding dust tokens. They may be spam or tracking attempts.");
  }

  // Concentration risk
  if (concentrationInfo?.dominancePercent > 70) {
    recommendations.push("Diversify holdings across multiple assets to reduce concentration risk.");
  }

  // Default if everything is clean
  if (recommendations.length === 0) {
    recommendations.push("No critical issues found. Continue monitoring your portfolio regularly.");
    recommendations.push("Consider using hardware wallets for long-term storage.");
  }

  return recommendations;
}

/**
 * generateSecuritySummary({ score, riskLevel, risks, tokens, concentrationInfo, dustCount })
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Generates a professional, human-readable security report.
 * Pure logic-based text generation — no external AI API needed.
 */
function generateSecuritySummary({ riskLevel, risks, concentrationInfo, dustCount }) {
  const parts = [];

  // Opening statement based on risk level
  parts.push("Wallet security analysis completed.");
  parts.push("");

  switch (riskLevel) {
    case "Excellent":
      parts.push("No critical threats were found. This wallet appears highly secure.");
      break;
    case "Good":
      parts.push("No critical threats were found. This wallet appears moderately secure.");
      break;
    case "Warning":
      parts.push("Several security concerns were detected that should be addressed.");
      break;
    case "Dangerous":
      parts.push("Critical security risks were detected. Use this wallet with extreme caution.");
      break;
  }

  // Count risks by severity
  const criticalRisks = risks.filter((r) => r.severity === "Critical");
  const highRisks = risks.filter((r) => r.severity === "High");

  // Report critical findings
  if (criticalRisks.length > 0) {
    const names = [...new Set(criticalRisks.map((r) => r.token))].join(", ");
    parts.push(`${criticalRisks.length} critical risk${criticalRisks.length > 1 ? "s" : ""} detected involving ${names}.`);
  }

  // Report high-severity findings
  if (highRisks.length > 0) {
    const types = [...new Set(highRisks.map((r) => r.type))].join(", ");
    parts.push(`${highRisks.length} high-risk issue${highRisks.length > 1 ? "s" : ""} found: ${types}.`);
  }

  // Report dust tokens
  if (dustCount > 0) {
    parts.push(`${dustCount} low-value token${dustCount > 1 ? "s" : ""} appear${dustCount === 1 ? "s" : ""} to be spam airdrops.`);
  }

  // Report concentration
  if (concentrationInfo?.dominancePercent > 70) {
    parts.push(
      `Portfolio concentration is high, with ${concentrationInfo.dominancePercent.toFixed(0)}% allocated to ${concentrationInfo.dominantToken}.`
    );
  }

  // Overall rating
  parts.push("");
  parts.push(`Overall wallet security is rated ${riskLevel}.`);

  return parts.join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // ── Method Check ───────────────────────────────────────────────────────
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  try {
    const { address, chain = "eth" } = req.query;

    // ── Validate Address ─────────────────────────────────────────────────
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameter: address",
      });
    }

    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid wallet address format. Must be a 42-character hex string starting with 0x.",
      });
    }

    // ── Validate Chain ───────────────────────────────────────────────────
    if (!SUPPORTED_CHAINS.includes(chain)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chain: ${chain}. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`,
      });
    }

    // ── Validate Environment ─────────────────────────────────────────────
    if (!MORALIS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "MORALIS_API_KEY is not configured on the server.",
      });
    }

    // ── Step 1: Fetch Wallet Balances ────────────────────────────────────
    const tokens = await fetchWalletBalances(address, chain);

    // ── Step 2: Calculate Total Portfolio Value ──────────────────────────
    const portfolioValueUSD = parseFloat(tokens.reduce((sum, t) => sum + (t.valueUSD || 0), 0).toFixed(2));

    // ── Step 3: Handle Empty Portfolio (FIX 5) ──────────────────────────
    // If the wallet has no tokens or zero value, return a clean score of 100.
    if (tokens.length === 0 || portfolioValueUSD === 0) {
      const emptyReport = {
        walletAddress: address,
        chain,
        score: 100,
        riskLevel: "Excellent",
        totalRisks: 0,
        risks: [],
        recommendations: ["No assets detected."],
        summary: "Wallet security analysis completed. This wallet contains little or no measurable token value. No security risks could be assessed due to the absence of assets. Overall wallet security is rated Excellent.",
        portfolioValueUSD: 0,
        scannedTokens: 0,
        scanTimestamp: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        ...emptyReport,
      });
    }

    // ── Step 4: Scan Tokens in Batches (FIX 4) ───────────────────────
    // GoPlus has rate limits. Scan in batches of 10 to avoid overwhelming
    // the API and crashing the dev server with 2000+ concurrent requests.
    const chainId = CHAIN_ID_MAP[chain];
    const BATCH_SIZE = 10;
    const scanResults = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((token) => scanTokenWithGoPlus(token, chainId))
      );
      scanResults.push(...batchResults);
    }

    // ── Step 5: Accumulate Risks and Penalties ──────────────────────────
    const allRisks = [];
    const allPenalties = [];

    for (const { risks, penalties } of scanResults) {
      allRisks.push(...risks);
      allPenalties.push(...penalties);
    }

    // ── Step 6: Dust Token Detection ────────────────────────────────────
    const dustResult = analyzeDustTokens(tokens);
    allRisks.push(...dustResult.risks);
    allPenalties.push(...dustResult.penalties);

    // ── Step 7: Portfolio Concentration Analysis ────────────────────────
    const concentrationResult = analyzeConcentration(tokens, portfolioValueUSD);
    allRisks.push(...concentrationResult.risks);
    allPenalties.push(...concentrationResult.penalties);

    // ── Step 8: Calculate Final Score ───────────────────────────────────
    const score = calculateScore(allPenalties);
    const riskLevel = determineRiskLevel(score);

    // ── Step 9: Generate Recommendations ────────────────────────────────
    const recommendations = generateRecommendations(
      allRisks,
      dustResult.dustCount,
      concentrationResult
    );

    // ── Step 10: Generate Security Summary ──────────────────────────────
    const summary = generateSecuritySummary({
      score,
      riskLevel,
      risks: allRisks,
      tokens,
      concentrationInfo: concentrationResult,
      dustCount: dustResult.dustCount,
    });

    // ── Step 11: Build Security Report Object (FIX 6) ──────────────────
    // This object will later be uploaded directly to 0G Storage.
    const securityReport = {
      walletAddress: address,
      chain,
      score,
      riskLevel,
      totalRisks: allRisks.length,
      risks: allRisks,
      recommendations,
      summary,
      portfolioValueUSD,
      scannedTokens: tokens.length,
      scanTimestamp: new Date().toISOString(),
    };

    // ── Return Response (FIX 2) ─────────────────────────────────────────
    return res.status(200).json({
      success: true,
      ...securityReport,
    });
  } catch (error) {
    // FIX 3: Graceful error handling — never crash, always return JSON
    const message =
      error.response?.data?.message || error.message || "An unexpected error occurred during security scan";
    const status = error.response?.status || 500;

    return res.status(status).json({ success: false, error: message });
  }
}
