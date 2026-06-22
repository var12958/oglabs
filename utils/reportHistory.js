// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Report History (Local Persistence)
// ═══════════════════════════════════════════════════════════════════════════════
// Maintains a local JSON file (report-history.json) that tracks every report
// stored on 0G Storage. Capped at 100 entries (FIFO).
//
// saveToHistory(entry)  → void
// getHistory()          → array of history entries
// ═══════════════════════════════════════════════════════════════════════════════

import fs from "fs";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), "report-history.json");
const MAX_HISTORY = 100;

// ═══════════════════════════════════════════════════════════════════════════════
// saveToHistory(entry)
// ═══════════════════════════════════════════════════════════════════════════════
// Prepends a new entry to the history file. Creates the file if it doesn't exist.
// Trims to MAX_HISTORY entries to prevent unbounded growth.
// ═══════════════════════════════════════════════════════════════════════════════

export function saveToHistory(entry) {
  let history = [];

  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    } catch {
      history = [];
    }
  }

  history.unshift(entry);

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ═══════════════════════════════════════════════════════════════════════════════
// getHistory()
// ═══════════════════════════════════════════════════════════════════════════════
// Reads and returns the full history array. Returns empty array if file doesn't
// exist or is corrupted.
// ═══════════════════════════════════════════════════════════════════════════════

export function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
  } catch {
    return [];
  }
}
