import fs from "fs";
import { ssz } from "@lodestar/types";
import {
  createProof,
  ProofType,
  SingleProof,
} from "@chainsafe/persistent-merkle-tree";

main(773833, ssz.deneb).catch();

/**
 * @param {Object} opts
 * @param {number} opts.validatorIndex
 */
export async function main(validatorIndex, Fork = ssz.deneb) {
  const Validator = Fork.BeaconState.getPathInfo(["validators", 0]).type;

  // http -d $CL_URL/eth/v2/debug/beacon/states/finalized Accept:application/octet-stream
  // Phase 0. Think of it as of a seed value for our fixture.

  const r = await readBinaryState("finalized.bin");
  const state = Fork.BeaconState.deserializeToView(r);

  const finalizedEpoch = state.finalizedCheckpoint.epoch;
  const slotsPerEpoch = 32;
  const slotTimeSeconds = 12;
  const finalizedSlot = finalizedEpoch * slotsPerEpoch;
  const finalizedTimestamp =
    state.genesisTime + finalizedSlot * slotTimeSeconds;
  console.log("genesisTime", state.genesisTime);
  console.log("finalizedTimestamp", finalizedTimestamp);

  // Write code to get the latest finalized state block root
  const blockRoot = toHex(state.finalizedCheckpoint.root);
  console.log("Block root", blockRoot);

  const validator = state.validators.get(validatorIndex);

  const { gindex } = Fork.BeaconState.getPathInfo([
    "validators",
    validatorIndex,
  ]);
  const proof = createProof(state.node, {
    type: ProofType.single,
    gindex,
  }) as SingleProof;

  console.log({
    block: state.blockRoots[0],
    stateRoot: toHex(state.hashTreeRoot()),
    validator: {
      ...(Validator.toJson(validator) || {}),
      index: validatorIndex,
    },
    validatorProof: proof.witnesses.map(toHex),
  });
}

async function readBinaryState(filepath) {
  const stream = fs.createReadStream(filepath);

  const buffer: Buffer[] = [];
  for await (const chunk of stream) {
    buffer.push(chunk);
  }

  return Buffer.concat(buffer);
}

export function fromHex(s) {
  return Uint8Array.from(s.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

export function toHex(t) {
  return "0x" + Buffer.from(t).toString("hex");
}
