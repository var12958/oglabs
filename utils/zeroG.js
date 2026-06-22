// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — 0G Storage Integration
// ═══════════════════════════════════════════════════════════════════════════════
// Provides storeReport() and fetchReport() for persisting VaultSense reports
// on the 0G decentralized storage network (Newton Testnet).
//
// storeReport(reportData) → { rootHash, txHash }
// fetchReport(rootHash)   → parsed JSON report
//
// SDK: @0glabs/0g-ts-sdk v0.3.3
//   - MemData: in-memory buffer upload (extends AbstractFile)
//   - Indexer.upload(file, rpc, signer) → [{ txHash, rootHash }, err]
//   - Indexer.download(rootHash, filePath, proof) → Error | null (writes to disk)
// ═══════════════════════════════════════════════════════════════════════════════

import { MemData } from "@0glabs/0g-ts-sdk";
import { Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import os from "os";
import path from "path";

// ─── 0G Network Endpoints ─────────────────────────────────────────────────────

const INDEXER_RPC = "https://indexer-storage-testnet-standard.0g.ai";
const EVM_RPC = "https://evmrpc-testnet.0g.ai";

// ═══════════════════════════════════════════════════════════════════════════════
// storeReport(reportData)
// ═══════════════════════════════════════════════════════════════════════════════
// Serializes the report object to JSON, creates a MemData from the buffer,
// computes its Merkle tree, and uploads it to 0G Storage via the Indexer.
//
// NOTE: ZgFile only supports file paths (fromFilePath/fromNodeFileHandle).
//       For in-memory buffers, we use MemData which extends AbstractFile
//       and provides the same merkleTree()/createSubmission() interface.
//
// Returns: { rootHash: string, txHash: string }
// Throws on missing private key, Merkle tree errors, or upload failures.
// ═══════════════════════════════════════════════════════════════════════════════

export async function storeReport(reportData) {
  const privateKey = process.env.ZG_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ZG_PRIVATE_KEY is not configured in environment variables.");
  }

  // ── Step 1: Set up provider and wallet ──────────────────────────────────
  const provider = new ethers.JsonRpcProvider(EVM_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  // ── Step 2: Serialize report to buffer and create MemData ───────────────
  //    MemData accepts a Uint8Array/Buffer and extends AbstractFile,
  //    giving us merkleTree(), createSubmission(), size(), etc.
  const content = Buffer.from(JSON.stringify(reportData));
  const file = new MemData(content);

  // ── Step 3: Compute Merkle tree for integrity verification ──────────────
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) {
    throw new Error("Merkle tree computation failed: " + treeErr);
  }

  // ── Step 4: Upload to 0G Storage via Indexer ────────────────────────────
  //    Indexer.upload() accepts any AbstractFile subclass (MemData works).
  //    Returns [{ txHash, rootHash }, Error | null]
  const indexer = new Indexer(INDEXER_RPC);
  const [result, uploadErr] = await indexer.upload(file, EVM_RPC, wallet);
  if (uploadErr) {
    throw new Error("0G upload failed: " + uploadErr);
  }

  // ── Step 5: Return root hash and transaction hash ───────────────────────
  return {
    rootHash: result.rootHash,
    txHash: result.txHash,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// fetchReport(rootHash)
// ═══════════════════════════════════════════════════════════════════════════════
// Downloads a previously stored report from 0G Storage using its root hash.
//
// NOTE: Indexer.download() writes data to a file path (not a buffer).
//       We download to a temp file, read it back, parse JSON, then clean up.
//
// Returns: parsed JSON report object
// Throws on download errors or invalid JSON.
// ═══════════════════════════════════════════════════════════════════════════════

export async function fetchReport(rootHash) {
  const indexer = new Indexer(INDEXER_RPC);

  // ── Step 1: Create temp file path (must not already exist) ──────────────
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `vaulsense_0g_${Date.now()}.json`);

  try {
    // ── Step 2: Download to temp file ─────────────────────────────────────
    //    download(rootHash, filePath, proof) → Error | null
    //    The file at filePath must NOT already exist.
    const err = await indexer.download(rootHash, tmpFile, false);
    if (err) {
      throw new Error("0G download failed: " + err.message);
    }

    // ── Step 3: Read and parse the downloaded file ────────────────────────
    const raw = fs.readFileSync(tmpFile, "utf-8");
    return JSON.parse(raw);
  } finally {
    // ── Step 4: Clean up temp file ────────────────────────────────────────
    try {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    } catch (_) {
      // Ignore cleanup errors
    }
  }
}
