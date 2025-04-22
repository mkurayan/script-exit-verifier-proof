/**
 * Read a beacon‑chain block root that the execution layer stored
 * in the EIP‑4788 contract.
 */

import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02";

async function main() {
  if (!process.env.EL_URL) {
    throw new Error("Set EL_URL env‑var to an EL+CL JSON‑RPC endpoint");
  }
  const provider = new ethers.JsonRpcProvider(process.env.EL_URL);

  // Grab the timestamp argument from CLI ↓
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: ts-node fetch-beacon-root.ts <unixTimestamp>");
    process.exit(1);
  }
  const ts = BigInt(arg);
  if (ts === 0n) {
    throw new Error("Timestamp 0 is invalid – the contract will revert");
  }

  const calldata = ethers.zeroPadValue(ethers.toBeHex(ts), 32);

  // Raw eth_call because there is no selector/ABI:
  const rootBytes = await provider.call({
    to: CONTRACT_ADDRESS,
    data: calldata,
  });

  console.log(`⛓️  Beacon root for timestamp ${ts}: ${rootBytes}`);
  // If you prefer a Bytes32:
  // const root = ethers.hexlify(rootBytes as `0x${string}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
