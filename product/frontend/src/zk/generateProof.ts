// ===============================
// File: src/zk/generateProof.ts
// ===============================
import { groth16 } from 'snarkjs';
import { poseidon2 as poseidon } from 'poseidon-lite';
import wasmUrl from './withdraw_js/withdraw.wasm?url';
import zkeyUrl from './withdraw_final.zkey?url';
import {  toBeHex, zeroPadValue } from 'ethers';

export type ProofInput = {
  noteB64: string;  // base64 文字列 (note)
  rootHex: string;  // currentRoot (0x...32byte)
  idx: number;      // leaf index (現状 idx=0 前提)
  leaves: string[]; // 先頭 8 枚の葉 (将来の動的パス生成用)
};

const TREE_DEPTH = 3;  // ← 深さ3固定

/** 0, Poseidon(0,0), Poseidon(Poseidon(0,0), Poseidon(0,0)) */
const ZERO_HASHES: bigint[] = (() => {
  const hs: bigint[] = [0n];
  let cur = 0n;
  for (let i = 1; i < TREE_DEPTH; i++) {
    cur = poseidon([cur, cur]);
    hs.push(cur);
  }
  return hs;
})();

/** base64url を base64 に変換する */
function base64urlToBase64(b64url: string): string {
  return b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
}

/** 証明を生成 */
export async function generateProofRaw(
  noteB64: string,
  rootHex: string,
  leaves: string[],
  leafIndex: number,
  log: (msg: string) => void = () => {}
) {
  log('parse note');

  // note を base64url → base64 に変換してから JSON 解析
  const note = JSON.parse(atob(base64urlToBase64(noteB64)));

  // 入力データ作成
  const pathIndices: number[] = [];
  const pathElements: string[] = [];
  let currentLevelLeaves = [...leaves]; // Start with the bottom-level leaves
let currentIndex = leafIndex;

for (let level = 0; level < 3; level++) {
  const siblingIndex = currentIndex ^ 1; // XOR to get sibling index
  pathIndices.push(currentIndex % 2);   // 0 for left, 1 for right
  pathElements.push(currentLevelLeaves[siblingIndex]);

  // Compute the parent level
  const nextLevelLeaves: string[] = [];
  for (let i = 0; i < currentLevelLeaves.length; i += 2) {
    const left = currentLevelLeaves[i];
    const right = currentLevelLeaves[i + 1];
    nextLevelLeaves.push(poseidonHex(left, right));
  }

  currentLevelLeaves = nextLevelLeaves; // Move to the next level
  currentIndex = Math.floor(currentIndex / 2);
}

  const input = {
    n: BigInt('0x' + note.n),
    s: BigInt('0x' + note.s),
    root: BigInt(rootHex),
    // ✅ 修正ポイント 1: pathElements の変換
    pathElements: pathElements.map(e =>
      BigInt(e.startsWith('0x') ? e : ('0x' + e))
    ),
    // ✅ 修正ポイント 2: pathIndices を BigInt に変換
    pathIndices: pathIndices.map(BigInt),
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
    inputs: [
      publicSignals[0],  // nullifierHash
      rootHex,           // root
    ] as [string, string],
  };
}
function poseidonHex(a:string,b:string){
  const h = poseidon([BigInt(a),BigInt(b)]);
  return zeroPadValue(toBeHex(h),32);
}