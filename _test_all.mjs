// Endpoint validation — tests each endpoint sequentially, checks server health after each
const BASE = "http://localhost:3000";

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timeout = options.timeout || 30000;
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  
  try {
    const fetchOpts = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    };
    if (options.body) fetchOpts.body = JSON.stringify(options.body);
    
    const res = await fetch(url, fetchOpts);
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    const json = await res.json();
    return { status: res.status, elapsed, json };
  } catch (err) {
    clearTimeout(timer);
    return { status: 0, elapsed: Date.now() - start, error: err.name === "AbortError" ? "TIMEOUT" : err.message };
  }
}

async function serverAlive() {
  const r = await fetchJSON(`${BASE}/api/0g/fetch`, { timeout: 5000 });
  return r.status === 200;
}

const results = [];

async function test(name, fn) {
  console.log(`\n--- Testing: ${name} ---`);
  const result = await fn();
  const alive = await serverAlive();
  result.serverAliveAfter = alive;
  results.push(result);
  console.log(JSON.stringify(result, null, 2));
  if (!alive) {
    console.log("!! SERVER CRASHED after " + name + " — aborting remaining tests");
    process.exit(1);
  }
}

async function main() {
  // Test 1: 0G Fetch (lightweight)
  await test("0g/fetch", async () => {
    const r = await fetchJSON(`${BASE}/api/0g/fetch`, { timeout: 10000 });
    return { endpoint: "0g/fetch", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, totalReports: r.json?.totalReports, error: r.error || r.json?.error };
  });

  // Test 2: Wallet Balances
  await test("wallet/balances", async () => {
    const r = await fetchJSON(`${BASE}/api/wallet/balances?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chain=base`, { timeout: 30000 });
    return { endpoint: "wallet/balances", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, totalUSD: r.json?.totalUSD, tokenCount: r.json?.tokens?.length, error: r.error || r.json?.error };
  });

  // Test 3: Security Scan (with native price fix)
  await test("security/scan", async () => {
    const r = await fetchJSON(`${BASE}/api/security/scan?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chain=base`, { timeout: 120000 });
    return { endpoint: "security/scan", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, score: r.json?.score, riskLevel: r.json?.riskLevel, scannedTokens: r.json?.scannedTokens, totalRisks: r.json?.totalRisks, portfolioValueUSD: r.json?.portfolioValueUSD, error: r.error || r.json?.error };
  });

  // Test 4: AI Analyze (needs securityReport or routeReport in body)
  await test("ai/analyze", async () => {
    const r = await fetchJSON(`${BASE}/api/ai/analyze`, {
      method: "POST", timeout: 30000,
      body: {
        securityReport: { score: 100, riskLevel: "Excellent", totalRisks: 0, portfolioValueUSD: 5404, scannedTokens: 3, risks: [], recommendations: ["No critical issues found."] },
        routeReport: { bestChain: "ethereum", fromToken: "ETH", toToken: "USDC", inputAmount: 1, gainPercent: 0.27, estimatedSavingsUSD: 0.24, routesAnalyzed: 3 },
      },
    });
    return { endpoint: "ai/analyze", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, hasAnalysis: typeof r.json?.analysis === "string" && r.json.analysis.length > 0, analysisLen: r.json?.analysis?.length, error: r.error || r.json?.error };
  });

  // Test 5: 0G Store
  await test("0g/store", async () => {
    const r = await fetchJSON(`${BASE}/api/0g/store`, { method: "POST", timeout: 60000, body: { reportType: "analysis", walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", data: { message: "integration test" } } });
    return { endpoint: "0g/store", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, rootHash: r.json?.rootHash?.substring(0, 20) + "...", txHash: r.json?.txHash?.substring(0, 20) + "...", error: r.error || r.json?.error };
  });

  // Test 6: 0G Fetch after store
  await test("0g/fetch-after-store", async () => {
    const r = await fetchJSON(`${BASE}/api/0g/fetch`, { timeout: 10000 });
    return { endpoint: "0g/fetch", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, totalReports: r.json?.totalReports, error: r.error || r.json?.error };
  });

  // Test 7: Routes Best
  await test("routes/best", async () => {
    const r = await fetchJSON(`${BASE}/api/routes/best?fromToken=ETH&toToken=USDC&amount=1`, { timeout: 90000 });
    return { endpoint: "routes/best", status: r.status, elapsed: r.elapsed + "ms", success: r.json?.success, bestChain: r.json?.bestChain, gainPercent: r.json?.gainPercent, routeCount: r.json?.routes?.length, routesAnalyzed: r.json?.routeReport?.routesAnalyzed, error: r.error || r.json?.error };
  });

  console.log("\n\n========== FINAL SUMMARY ==========\n");
  for (const r of results) {
    const icon = r.success ? "✅" : (r.error ? "❌" : "⚠️");
    console.log(`${icon} ${r.endpoint}: status=${r.status} time=${r.elapsed} alive=${r.serverAliveAfter} err=${r.error || "none"}`);
  }
}

main().catch(console.error);
