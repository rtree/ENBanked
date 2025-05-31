// ===============================
// File: src/zk/generateProof.ts
// (メインスレでも Worker でも使える純粋関数)
// ===============================
import { groth16 } from 'snarkjs';
import { poseidon1 as poseidon } from 'poseidon-lite';
import wasmUrl from './withdraw_js/withdraw.wasm?url';
import zkeyUrl from './withdraw_final.zkey?url';
import type { LogFn } from '../utils/logger';

export async function generateProofRaw(
  noteB64: string,
  rootHex: string,
  log: LogFn = () => {}
) {
  log('parse note');
  const note = JSON.parse(atob(noteB64)); // { n, s, idx }

  const nullifierHash = poseidon([BigInt('0x' + note.n)]).toString();

  const input = {
    n: BigInt('0x' + note.n),
    s: BigInt('0x' + note.s),
    root: BigInt(rootHex),
    pathElements: Array(10).fill(0n), // idx=0 用。深さ3なら 3 にする
    pathIndices: Array(10).fill(0),
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
      '0x' + BigInt(nullifierHash).toString(16),
      rootHex,
    ] as [string, string],
  };
}
