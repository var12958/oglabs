import { GoogleGenerativeAI } from "@google/generative-ai";

// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — AI Intelligence Layer
// ═══════════════════════════════════════════════════════════════════════════════
// Takes security scan and route optimization outputs, sends them to Google
// Gemini 2.5 Flash, and returns a professional AI-powered analysis report.
//
// Usage: POST /api/ai/analyze
// Body: { securityReport: {...}, routeReport: {...} }
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Environment Variables ────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Gemini Configuration ─────────────────────────────────────────────────────

const MODEL_NAME = "gemini-2.5-flash";
const GENERATION_CONFIG = {
  temperature: 0.4,
  maxOutputTokens: 512,
  topP: 0.9,
};

const SYSTEM_PROMPT = `You are VaultSense AI.
You are a crypto security and portfolio intelligence analyst.
Analyze wallet security findings and route optimization data.
Write a professional report.

Rules:
- Use plain English
- Be concise
- Explain risks clearly
- Explain route recommendation clearly
- Maximum 250 words
- Sound like a fintech product
- Do not use markdown
- Do not mention being an AI model`;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * generateAnalysisPrompt(securityReport, routeReport)
 * ────────────────────────────────────────────────────
 * Builds a structured prompt from the security and route reports.
 * Extracts key metrics and formats them for the AI model.
 */
function generateAnalysisPrompt(securityReport, routeReport) {
  const parts = [];

  // ── Security Section ────────────────────────────────────────────────────
  parts.push("=== WALLET SECURITY SCAN ===");

  if (securityReport) {
    parts.push(`Security Score: ${securityReport.score}/100`);
    parts.push(`Risk Level: ${securityReport.riskLevel}`);
    parts.push(`Total Risks Found: ${securityReport.totalRisks}`);
    parts.push(`Portfolio Value: $${securityReport.portfolioValueUSD || 0}`);
    parts.push(`Tokens Scanned: ${securityReport.scannedTokens || 0}`);

    if (securityReport.risks && securityReport.risks.length > 0) {
      parts.push("");
      parts.push("Detected Risks:");
      for (const risk of securityReport.risks) {
        parts.push(`- [${risk.severity}] ${risk.type}: ${risk.description}`);
      }
    }

    if (securityReport.recommendations && securityReport.recommendations.length > 0) {
      parts.push("");
      parts.push("Existing Recommendations:");
      for (const rec of securityReport.recommendations) {
        parts.push(`- ${rec}`);
      }
    }
  } else {
    parts.push("No security scan data provided.");
  }

  // ── Route Section ───────────────────────────────────────────────────────
  parts.push("");
  parts.push("=== ROUTE OPTIMIZATION ===");

  if (routeReport) {
    parts.push(`Best Chain: ${routeReport.bestChain || "N/A"}`);
    parts.push(`Swap: ${routeReport.fromToken || "?"} to ${routeReport.toToken || "?"}`);
    parts.push(`Input Amount: ${routeReport.inputAmount || "?"}`);
    parts.push(`Gain Percent: ${routeReport.gainPercent || 0}%`);
    parts.push(`Estimated Savings: $${routeReport.estimatedSavingsUSD || 0}`);
    parts.push(`Routes Analyzed: ${routeReport.routesAnalyzed || 0}`);
  } else {
    parts.push("No route optimization data provided.");
  }

  // ── Instruction ─────────────────────────────────────────────────────────
  parts.push("");
  parts.push("=== INSTRUCTIONS ===");
  parts.push("Based on the above data, provide a concise VaultSense analysis covering:");
  parts.push("1. Overall wallet health assessment");
  parts.push("2. Key security concerns (if any)");
  parts.push("3. Swap route recommendation and why");
  parts.push("4. Actionable next steps for the user");
  parts.push("Keep it under 250 words. Use plain English. No markdown.");

  return parts.join("\n");
}

/**
 * validateRequestBody(body)
 * ─────────────────────────
 * Validates the incoming POST body. Returns an error string or null.
 */
function validateRequestBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  if (!body.securityReport && !body.routeReport) {
    return "At least one of securityReport or routeReport is required.";
  }

  if (body.securityReport && typeof body.securityReport !== "object") {
    return "securityReport must be an object.";
  }

  if (body.routeReport && typeof body.routeReport !== "object") {
    return "routeReport must be an object.";
  }

  return null;
}

/**
 * callGemini(prompt)
 * ──────────────────
 * Sends the prompt to Gemini 2.5 Flash and returns the generated text.
 * Throws on API errors so the caller can handle them.
 */
async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: GENERATION_CONFIG,
  });

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response || !response.text()) {
    throw new Error("Gemini returned an empty response.");
  }

  return response.text().trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // ── Method Check ─────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    // ── Step 1: Validate Environment ─────────────────────────────────────
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server.",
      });
    }

    // ── Step 2: Validate Request Body ────────────────────────────────────
    const validationError = validateRequestBody(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // ── Step 3: Extract Reports ──────────────────────────────────────────
    const { securityReport, routeReport } = req.body;

    // ── Step 4: Build Prompt ─────────────────────────────────────────────
    const prompt = generateAnalysisPrompt(securityReport, routeReport);

    // ── Step 5: Call Gemini ───────────────────────────────────────────────
    const aiAnalysis = await callGemini(prompt);

    // ── Step 6: Build VaultSense Report ──────────────────────────────────
    // Bundles all data into a single object for 0G Storage upload.
    const vaultSenseReport = {
      securityReport: securityReport || null,
      routeReport: routeReport || null,
      aiAnalysis,
      generatedAt: new Date().toISOString(),
    };

    // ── Return Response ──────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      analysis: aiAnalysis,
      vaultSenseReport,
    });
  } catch (error) {
    const message =
      error.message || "An unexpected error occurred during AI analysis.";

    return res.status(500).json({ success: false, error: message });
  }
}
