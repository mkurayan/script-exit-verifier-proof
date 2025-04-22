import fs from "fs";
import { ssz } from "@lodestar/types";
import { createProof, ProofType } from "@chainsafe/persistent-merkle-tree";

main(773833, ssz.deneb, ssz.deneb).catch();

/**
 * @param {Object} opts
 * @param {number} opts.validatorIndex
 */
async function main(validatorIndex, Fork = ssz.deneb) {
  const Validator = Fork.BeaconState.getPathInfo(["validators", 0]).type;

  // http -d $CL_URL/eth/v2/debug/beacon/states/finalized Accept:application/octet-stream
  // Phase 0. Think of it as of a seed value for our fixture.

  const r = await readBinaryState("finalized.bin");
  const state = Fork.BeaconState.deserializeToView(r);

  const validator = state.validators.get(validatorIndex);

  const { gindex } = Fork.BeaconState.getPathInfo(["validators", validatorIndex]);
  const proof = createProof(state.node, {
    type: ProofType.single,
    gindex,
  });

  console.log({
    stateRoot: toHex(state.hashTreeRoot()),
    validator: { ...Validator.toJson(validator), index: validatorIndex },
    validatorProof: proof.witnesses.map(toHex),
  });
}

async function readBinaryState(filepath) {
  const stream = fs.createReadStream(filepath);

  const buffer = [];
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
