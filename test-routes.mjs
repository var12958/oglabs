// Standalone test for LiFi quote fetching — bypasses Next.js
import axios from "axios";

const LIFI_BASE_URL = "https://li.quest/v1";
const DEFAULT_QUOTE_ADDRESS = "0x000000000000000000000000000000000000dEaD";

const CHAINS = [
  { id: 1, key: "ethereum", name: "Ethereum" },
  { id: 8453, key: "base", name: "Base" },
  { id: 42161, key: "arbitrum", name: "Arbitrum" },
];

const TOKEN_MAP = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  },
};

const TOKEN_DECIMALS = { ETH: 18, USDC: 6 };

async function testChain(chain) {
  const fromSymbol = "ETH";
  const toSymbol = "USDC";
  const amount = 1;
  const decimals = TOKEN_DECIMALS[fromSymbol] || 18;
  const fromAmount = BigInt(Math.round(amount * Math.pow(10, decimals))).toString();

  const fromTokenAddr = TOKEN_MAP[fromSymbol];
  const toTokenAddr = TOKEN_MAP[toSymbol][chain.id];

  console.log(`\n=== Testing ${chain.name} (chain ${chain.id}) ===`);
  console.log(`fromToken: ${fromTokenAddr}`);
  console.log(`toToken: ${toTokenAddr}`);
  console.log(`fromAmount: ${fromAmount}`);

  try {
    const start = Date.now();
    const response = await axios.get(`${LIFI_BASE_URL}/quote`, {
      params: {
        fromChain: chain.id,
        toChain: chain.id,
        fromToken: fromTokenAddr,
        toToken: toTokenAddr,
        fromAmount: fromAmount,
        fromAddress: DEFAULT_QUOTE_ADDRESS,
        order: "CHEAPEST",
      },
      timeout: 15000,
    });
    const elapsed = Date.now() - start;
    console.log(`✅ ${chain.name}: ${response.data.estimate?.toAmount} (${elapsed}ms)`);
  } catch (err) {
    console.error(`❌ ${chain.name} FAILED:`);
    console.error(`  Status: ${err.response?.status}`);
    console.error(`  Data: ${JSON.stringify(err.response?.data)}`);
    console.error(`  Message: ${err.message}`);
  }
}

async function main() {
  console.log("Testing LiFi quotes for 1 ETH -> USDC on all chains...\n");
  
  // Test sequentially first
  for (const chain of CHAINS) {
    await testChain(chain);
  }

  console.log("\n\nNow testing with Promise.allSettled...");
  const start = Date.now();
  const results = await Promise.allSettled(CHAINS.map(chain => testChain(chain)));
  console.log(`\nPromise.allSettled completed in ${Date.now() - start}ms`);
  console.log("Results:", results.map(r => r.status));
}

main().catch(e => console.error("FATAL:", e));
