// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — 0G Storage API: Store Report
// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/0g/store
// Accepts a VaultSense report and stores it on 0G decentralized storage.
// Also saves a history entry locally for quick retrieval.
//
// Body: { reportType, walletAddress, data }
// Returns: { success, rootHash, txHash, explorerUrl, report }
// ═══════════════════════════════════════════════════════════════════════════════

import { storeReport } from "../../../utils/zeroG.js";
import { saveToHistory } from "../../../utils/reportHistory.js";

export default async function handler(req, res) {
  // ── Method Check ─────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  // ── Validate Request Body ────────────────────────────────────────────────
  const { reportType, walletAddress, data } = req.body || {};

  if (!reportType || !walletAddress || !data) {
    return res.status(400).json({
      success: false,
      error: "reportType, walletAddress, and data are required.",
    });
  }

  try {
    // ── Build Report Object ─────────────────────────────────────────────
    const report = {
      reportType,
      walletAddress,
      data,
      timestamp: new Date().toISOString(),
      network: "0G-Newton-Testnet",
    };

    // ── Upload to 0G Storage ────────────────────────────────────────────
    const result = await storeReport(report);

    // ── Save to Local History ───────────────────────────────────────────
    saveToHistory({
      rootHash: result.rootHash,
      txHash: result.txHash,
      reportType,
      walletAddress,
      timestamp: report.timestamp,
    });

    // ── Return Response ─────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Report stored on 0G successfully",
      rootHash: result.rootHash,
      txHash: result.txHash,
      explorerUrl: `https://chainscan-newton.0g.ai/tx/${result.txHash}`,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
