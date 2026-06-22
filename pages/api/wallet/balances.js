import axios from "axios";

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = "https://deep-index.moralis.io/api/v2.2";

const SUPPORTED_CHAINS = ["eth", "polygon", "bsc", "arbitrum", "base"];

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "DAI", "BUSD"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { address, chain = "eth" } = req.query;

    if (!address) {
      return res.status(400).json({ success: false, error: "Missing required query parameter: address" });
    }

    if (!SUPPORTED_CHAINS.includes(chain)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported chain: ${chain}. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`,
      });
    }

    if (!MORALIS_API_KEY) {
      return res.status(500).json({ success: false, error: "MORALIS_API_KEY is not configured" });
    }

    // Fetch ERC-20 token balances
    const tokenBalancesRes = await axios.get(
      `${MORALIS_BASE_URL}/${address}/erc20`,
      {
        params: { chain },
        headers: { "X-API-Key": MORALIS_API_KEY },
        timeout: 15000,
      }
    );

    // Fetch native token balance
    const nativeBalanceRes = await axios.get(
      `${MORALIS_BASE_URL}/${address}/balance`,
      {
        params: { chain },
        headers: { "X-API-Key": MORALIS_API_KEY },
        timeout: 10000,
      }
    );

    const nativeChainNames = {
      eth: "Ethereum",
      polygon: "Polygon",
      bsc: "BNB Smart Chain",
      arbitrum: "Arbitrum",
      base: "Base",
    };

    const nativeChainSymbols = {
      eth: "ETH",
      polygon: "POL",
      bsc: "BNB",
      arbitrum: "ETH",
      base: "ETH",
    };

    const nativeBalance = nativeBalanceRes.data?.balance || "0";
    const nativeDecimals = 18;
    const nativeAmount = parseFloat(nativeBalance) / Math.pow(10, nativeDecimals);

    // Fetch native token price (ETH / native coin) via Moralis ERC-20 prices endpoint
    let nativePriceUSD = 0;
    try {
      const nativeTokenAddresses = {
        eth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        bsc: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        base: "0x4200000000000000000000000000000000000006",
      };

      const priceRes = await axios.post(
        `${MORALIS_BASE_URL}/erc20/prices`,
        {
          tokens: [{ token_address: nativeTokenAddresses[chain] }],
        },
        {
          params: { chain, include: "percent_change" },
          headers: { "X-API-Key": MORALIS_API_KEY },
          timeout: 10000,
        }
      );

      nativePriceUSD = parseFloat(priceRes.data?.[0]?.usdPrice) || 0;
    } catch (priceErr) {
      // Silently ignore — native price will be 0
    }

    // Build tokens array starting with native token
    const tokens = [];

    if (nativeAmount > 0) {
      tokens.push({
        name: nativeChainNames[chain] || chain,
        symbol: nativeChainSymbols[chain] || chain.toUpperCase(),
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
      };
    });

    tokens.push(...erc20Tokens);

    // Sort tokens by USD value descending
    tokens.sort((a, b) => b.valueUSD - a.valueUSD);

    // Calculate total USD value
    const totalUSD = parseFloat(tokens.reduce((sum, t) => sum + t.valueUSD, 0).toFixed(2));

    // Filter stablecoins
    const stablecoins = tokens.filter((t) => STABLECOIN_SYMBOLS.has(t.symbol.toUpperCase()));
    const stablecoinTotalUSD = parseFloat(stablecoins.reduce((sum, t) => sum + t.valueUSD, 0).toFixed(2));

    return res.status(200).json({
      success: true,
      totalUSD,
      tokens,
      stablecoins,
      stablecoinTotalUSD,
    });
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "An unexpected error occurred";
    const status = error.response?.status || 500;

    return res.status(status).json({ success: false, error: message });
  }
}
