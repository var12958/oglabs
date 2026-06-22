// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — 0G Storage API: Fetch Report
// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/0g/fetch
// Without rootHash → returns local report history list
// With rootHash    → downloads and returns the full report from 0G Storage
//
// Query: ?rootHash=<hash> (optional)
// Returns: { success, report } or { success, totalReports, reports }
// ═══════════════════════════════════════════════════════════════════════════════

import { fetchReport } from "../../../utils/zeroG.js";
import { getHistory } from "../../../utils/reportHistory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use GET.",
    });
  }

  const { rootHash } = req.query;

  try {
    // ── No rootHash → Return Local History ──────────────────────────────
    if (!rootHash) {
      const history = getHistory();
      return res.status(200).json({
        success: true,
        totalReports: history.length,
        reports: history,
      });
    }

    // ── rootHash Provided → Download from 0G Storage ────────────────────
    const report = await fetchReport(rootHash);
    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
