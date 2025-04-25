import fs from "fs";
import { ssz } from "@lodestar/types";
import {
  createProof,
  ProofType,
  SingleProof,
} from "@chainsafe/persistent-merkle-tree";
import { hashTreeRoot } from "./hashTreeRoot";

const EXIT_REQUESTS_INDEX = 1; //ToDo: get vebo index
const VALIDATOR_INDEX = 773833; //ToDo: get validator index

main(VALIDATOR_INDEX, ssz.deneb).catch();

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
    proposerIndex: state.latestBlockHeader.proposerIndex,
    parentRoot: toHex(state.latestBlockHeader.parentRoot),
    bodyRoot: toHex(state.latestBlockHeader.bodyRoot),
    stateRoot: toHex(state.hashTreeRoot()),
  } as any;

  const validatorJson = (Validator.toJson(validator) || {}) as any;

  console.log(
    JSON.stringify({
      header: beaconBlockHeader,
      rootsTimestamp: finalizedTimestamp,
    })
  );

  console.log("=========================");

  console.log(
    JSON.stringify([
      {
        // The index of an exit request in the VEBO exit requests data
        exitRequestIndex: EXIT_REQUESTS_INDEX,
        // -------------------- Validator details -------------------
        withdrawalCredentials: validatorJson.withdrawal_credentials,
        effectiveBalance: validatorJson.effective_balance,
        slashed: validatorJson.slashed,
        activationEligibilityEpoch: validatorJson.activation_eligibility_epoch,
        activationEpoch: validatorJson.activation_epoch,
        withdrawableEpoch: validatorJson.withdrawable_epoch,
        // ------------------------ Proof ---------------------------
        validatorProof: proof.witnesses.map(toHex),
      },
    ])
  );

  console.log("=========================");

  console.log({
    beaconBlockHeader,
    beaconBlockHeaderRoot: hashTreeRoot({
      slot: BigInt(beaconBlockHeader.slot),
      proposerIndex: BigInt(beaconBlockHeader.proposerIndex),
      parentRoot: beaconBlockHeader.parentRoot,
      stateRoot: beaconBlockHeader.stateRoot,
      bodyRoot: beaconBlockHeader.bodyRoot,
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
