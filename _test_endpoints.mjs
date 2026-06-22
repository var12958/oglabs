// Endpoint validation script — runs all tests sequentially with tight timeouts
const BASE = "http://localhost:3000";

async function testEndpoint(name, url, options = {}) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || 30000);
    
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
    
    // Extract only key fields
    const summary = {
      endpoint: name,
      status: res.status,
      elapsed: `${elapsed}ms`,
      success: json.success,
    };
    
    // Add endpoint-specific fields
    if (name === "routes/best") {
      summary.bestChain = json.bestChain;
      summary.gainPercent = json.gainPercent;
      summary.routeCount = json.routes?.length;
      summary.routesAnalyzed = json.routeReport?.routesAnalyzed;
      summary.hasExplanation = !!json.explanation;
    } else if (name === "0g/store") {
      summary.rootHash = json.rootHash ? json.rootHash.substring(0, 20) + "..." : null;
      summary.txHash = json.txHash ? json.txHash.substring(0, 20) + "..." : null;
      summary.message = json.message;
    } else if (name === "0g/fetch") {
      summary.totalReports = json.totalReports;
      summary.reportCount = json.reports?.length;
    } else if (name === "wallet/balances") {
      summary.totalUSD = json.totalUSD;
      summary.tokenCount = json.tokens?.length;
    } else if (name === "security/scan") {
      summary.hasReport = !!json.report;
      summary.riskLevel = json.report?.overallRisk?.level;
    } else if (name === "ai/analyze") {
      summary.hasAnalysis = !!json.analysis;
      summary.provider = json.analysis?.provider;
    }
    
    if (json.error) summary.error = json.error;
    
    return summary;
  } catch (err) {
    return {
      endpoint: name,
      elapsed: `${Date.now() - start}ms`,
      error: err.name === "AbortError" ? "TIMEOUT" : err.message,
    };
  }
}

async function runAllTests() {
  const results = [];
  
  // 1. Wallet balances
  results.push(await testEndpoint(
    "wallet/balances",
    `${BASE}/api/wallet/balances?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chain=base`,
    { timeout: 30000 }
  ));
  
  // 2. 0G Fetch (before store)
  results.push(await testEndpoint(
    "0g/fetch",
    `${BASE}/api/0g/fetch`,
    { timeout: 15000 }
  ));
  
  // 3. 0G Store
  results.push(await testEndpoint(
    "0g/store",
    `${BASE}/api/0g/store`,
    {
      method: "POST",
      timeout: 60000,
      body: {
        reportType: "analysis",
        walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        data: { message: "integration test" },
      },
    }
  ));
  
  // 4. 0G Fetch (after store — verify history)
  results.push(await testEndpoint(
    "0g/fetch-after-store",
    `${BASE}/api/0g/fetch`,
    { timeout: 15000 }
  ));
  
  // 5. Routes best
  results.push(await testEndpoint(
    "routes/best",
    `${BASE}/api/routes/best?fromToken=ETH&toToken=USDC&amount=1`,
    { timeout: 90000 }
  ));
  
  // 6. Security scan
  results.push(await testEndpoint(
    "security/scan",
    `${BASE}/api/security/scan?address=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045&chain=8453`,
    { timeout: 30000 }
  ));
  
  // 7. AI analyze
  results.push(await testEndpoint(
    "ai/analyze",
    `${BASE}/api/ai/analyze`,
    {
      method: "POST",
      timeout: 30000,
      body: {
        walletAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        chain: "base",
      },
    }
  ));
  
  console.log("\n========== ENDPOINT TEST RESULTS ==========\n");
  for (const r of results) {
    console.log(JSON.stringify(r, null, 2));
    console.log("---");
  }
  
  // Summary
  const passed = results.filter(r => r.success === true || r.success === undefined && !r.error).length;
  const failed = results.filter(r => r.error).length;
  console.log(`\nPASSED: ${passed} / ${results.length}`);
  console.log(`FAILED: ${failed} / ${results.length}`);
}

runAllTests().catch(console.error);
