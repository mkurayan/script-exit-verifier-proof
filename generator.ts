import fs from "fs";
import { ssz } from "@lodestar/types";
import {
  createProof,
  ProofType,
  SingleProof,
} from "@chainsafe/persistent-merkle-tree";
import { hashTreeRoot } from "./hashTreeRoot";

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

  const slotTimeSeconds = 12;
  const finalizedTimestamp =
    state.genesisTime + state.latestBlockHeader.slot * slotTimeSeconds;
  console.log("slot timestamp", finalizedTimestamp);

  const validator = state.validators.get(validatorIndex);

  const { gindex } = Fork.BeaconState.getPathInfo([
    "validators",
    validatorIndex,
  ]);
  const proof = createProof(state.node, {
    type: ProofType.single,
    gindex,
  }) as SingleProof;

  const beaconBlockHeader = {
    slot: state.slot,
    proposer_index: state.latestBlockHeader.proposerIndex,
    parent_root: toHex(state.latestBlockHeader.parentRoot),
    body_root: toHex(state.latestBlockHeader.bodyRoot),
    state_root: toHex(state.hashTreeRoot()),
  } as any;

  console.log({
    beaconBlockHeader,
    beaconBlockHeaderRoot: hashTreeRoot({
      slot: BigInt(beaconBlockHeader.slot),
      proposerIndex: BigInt(beaconBlockHeader.proposer_index),
      parentRoot: beaconBlockHeader.parent_root,
      stateRoot: beaconBlockHeader.state_root,
      bodyRoot: beaconBlockHeader.body_root,
    }),
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

function toHex(t) {
  return "0x" + Buffer.from(t).toString("hex");
}
