// ===============================
// File: src/zk/generateProof.ts
// ===============================
import { groth16 } from 'snarkjs';
import { poseidon2 as poseidon } from 'poseidon-lite';
import wasmUrl  from './withdraw_js/withdraw.wasm?url';
import zkeyUrl  from './withdraw_final.zkey?url';

export type ProofInput = {
  noteB64: string;    // base64 文字列を渡す
  rootHex: string;    // currentRoot (0x…32byte)
  idx:     number;    // leaf index (現状 idx=0 前提でも番号は持たせる)
  leaves:  string[];  // 先頭 8 枚の葉 (将来の動的パス生成用)
};

const TREE_DEPTH = 3;              // ← 深さ3固定

/** 0, Poseidon(0,0), Poseidon(Poseidon(0,0), Poseidon(0,0)) */
const ZERO_HASHES: bigint[] = (() => {
  const hs: bigint[] = [0n];
  let cur = 0n;
  for (let i = 1; i < TREE_DEPTH; i++) {
    cur = poseidon([cur, cur]);
    hs.push(cur);
  }
  return hs;                       // [0, h1, h2]
})();

/* ---------- 抜本的に pathElements / pathIndices は「idx=0 前提」 ---------- */
export async function generateProofRaw(
  note: { n: string; s: string; idx: number },
  rootHex: string,
  log: (msg: string) => void = () => {}
) {
  if (note.idx !== 0) throw new Error('idx≠0 未対応');

  const input = {
    n: BigInt('0x' + note.n),
    s: BigInt('0x' + note.s),
    root: BigInt(rootHex),
    pathElements: ZERO_HASHES,
    pathIndices: [0, 0, 0],
  };

  log('fullProve start');
  const { proof, publicSignals } = await groth16.fullProve(input, wasmUrl, zkeyUrl);
  log('fullProve done');

  return {
    a: proof.pi_a.slice(0, 2).map(BigInt),
    b: [
      proof.pi_b[0].slice(0, 2).map(BigInt),
      proof.pi_b[1].slice(0, 2).map(BigInt),
    ],
    c: proof.pi_c.slice(0, 2).map(BigInt),
    inputs: [publicSignals[0], rootHex],
  };
}