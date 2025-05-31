// src/zk/proofWorker.ts
import { expose } from 'comlink';              // yarn add comlink
import { groth16 } from 'snarkjs';
import wasmUrl  from './withdraw_js/withdraw.wasm?url';
import zkeyUrl  from './withdraw_final.zkey?url';
import { poseidon1 as poseidon } from 'poseidon-lite';
import type { ProofResult } from './proofTypes';

/** note(JSON) + root から proof を返す */
async function generate(noteB64: string, rootHex: string) {
  const note = JSON.parse(atob(noteB64));               // { n, s, idx }
  const nullifierHash = poseidon([BigInt('0x'+note.n)]).toString();

  /* ─ input オブジェクト ─ */
  const input = {
    n:      BigInt('0x' + note.n),
    s:      BigInt('0x' + note.s),
    root:   BigInt(rootHex),
    pathElements: [0n, 0n, 0n],     // idx=0 なので全部 0
    pathIndices:  [0, 0, 0]
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    wasmUrl,
    zkeyUrl
  );

  return {
    a: proof.pi_a.slice(0, 2).map(BigInt),
    b: [
      proof.pi_b[0].slice(0, 2).map(BigInt),
      proof.pi_b[1].slice(0, 2).map(BigInt),
    ],
    c: proof.pi_c.slice(0, 2).map(BigInt),
    inputs: [
      '0x' + BigInt(nullifierHash).toString(16),
      rootHex
    ] as [string, string]
  };
}

expose({ generate });
