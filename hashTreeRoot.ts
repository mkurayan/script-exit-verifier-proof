import { createHash } from "crypto";

/** All 32‑byte SSZ roots are hex‑strings with 0x‑prefix. */
export type Bytes32 = `0x${string}`;

/** BeaconBlockHeader as defined by the consensus specs (with uint64 numbers in JS bigint). */
export interface BeaconBlockHeader {
  slot: bigint; // uint64
  proposerIndex: bigint; // uint64
  parentRoot: Bytes32; // bytes32
  stateRoot: Bytes32; // bytes32
  bodyRoot: Bytes32; // bytes32
}

/** Convert a uint64 to a 32‑byte Buffer, little‑endian‑padded on the right with zeros. */
function toLittleEndian64(value: bigint): Buffer {
  const buf = Buffer.alloc(32); // filled with zeros by default
  buf.writeBigUInt64LE(value, 0); // first 8 bytes, LE format
  return buf;
}

/** Helper: convert "0x…" to a 32‑byte Buffer (throws if not 32 bytes). */
function hex32ToBuf(hex: Bytes32): Buffer {
  const cleaned = hex.slice(2); // drop 0x
  if (cleaned.length !== 64) throw new Error("Expected 32‑byte hex value");
  return Buffer.from(cleaned, "hex");
}

/**
 * Pure, synchronous implementation of the Solidity `hashTreeRoot`.
 * Returns a 0x‑prefixed hex string (bytes32).
 */
export function hashTreeRoot(header: BeaconBlockHeader): Bytes32 {
  /* Level‑0 leaves -------------------------------------------------------- */
  let nodes: Buffer[] = [
    toLittleEndian64(header.slot),
    toLittleEndian64(header.proposerIndex),
    hex32ToBuf(header.parentRoot),
    hex32ToBuf(header.stateRoot),
    hex32ToBuf(header.bodyRoot),
    Buffer.alloc(32), // zero‑leaf 1
    Buffer.alloc(32), // zero‑leaf 2
    Buffer.alloc(32), // zero‑leaf 3
  ];

  /* Build the Merkle tree -------------------------------------------------- */
  while (nodes.length > 1) {
    const nextLevel: Buffer[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const pair = Buffer.concat([nodes[i], nodes[i + 1]]); // 64 bytes
      const digest = createHash("sha256").update(pair).digest(); // 32 bytes
      nextLevel.push(digest);
    }
    nodes = nextLevel; // move up one level
  }

  // Only one node left – the root.
  return `0x${nodes[0].toString("hex")}` as Bytes32;
}
