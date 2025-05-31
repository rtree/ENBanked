// ===============================
// File: src/zk/generateProof.ts
// ===============================
import { groth16 } from 'snarkjs';
import { poseidon2 as poseidon } from 'poseidon-lite';
import wasmUrl from './withdraw_js/withdraw.wasm?url';
import zkeyUrl from './withdraw_final.zkey?url';

export type ProofInput = {
  noteB64: string;
  rootHex: string;
  idx: number;
  leaves: string[];
};

const TREE_DEPTH = 3;

const ZERO_HASHES: bigint[] = (() => {
  const hs: bigint[] = [0n];
  let cur = 0n;
  for (let i = 1; i < TREE_DEPTH; i++) {
    cur = poseidon([cur, cur]);
    hs.push(cur);
  }
  return hs;
})();

function base64urlToBase64(b64url: string): string {
  return b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
}

export async function generateProofRaw(
  noteB64: string,
  rootHex: string,
  log: (msg: string) => void = () => {}
) {
  if (!noteB64) throw new Error('noteB64 is undefined');

  log('parse note');
  const decoded = base64urlToBase64(noteB64);
  const note = JSON.parse(atob(decoded));

  if (note.idx !== 0) throw new Error('idx≠0 未対応');

  const input = {
    n: BigInt('0x' + note.n),
    s: BigInt('0x' + note.s),
    root: BigInt(rootHex),
    pathElements: ZERO_HASHES,
    pathIndices: [0, 0, 0],
  };

  log('fullProve start');
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    wasmUrl,
    zkeyUrl
  );
  log('fullProve done');

  return {
    a: proof.pi_a.slice(0, 2).map(BigInt),
    b: [
      proof.pi_b[0].slice(0, 2).map(BigInt),
      proof.pi_b[1].slice(0, 2).map(BigInt),
    ],
    c: proof.pi_c.slice(0, 2).map(BigInt),
    inputs: [
      publicSignals[0], // nullifierHash
      rootHex,          // root
    ] as [string, string],
  };
}
