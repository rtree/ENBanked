// ===============================
// File: src/zk/generateProof.ts
// ===============================
import { groth16 } from 'snarkjs';
import {
  poseidon1 as poseidon1,
  poseidon2 as poseidon2,
} from 'poseidon-lite';
import wasmUrl from './withdraw_js/withdraw.wasm?url';
import zkeyUrl from './withdraw_final.zkey?url';
import type { LogFn } from '../utils/logger';

// --------------------- 設定 ---------------------
/**
 * 現在の回路・コントラクトは深さ 3 (葉 8 枚) の Merkle Tree。
 * 変更したらここも合わせること。
 */
const TREE_DEPTH = 3;

// ------------------------------------------------
// 0 の兄弟ノードを Poseidon でハッシュして段ごとに保存
// ZERO_HASHES[0] → 1 段目 (Leaf level) の空ノードハッシュ
// ZERO_HASHES[1] → 2 段目 …
// ------------------------------------------------
const ZERO_HASHES: bigint[] = (() => {
  const elems: bigint[] = [0n];   // L0: raw 0
  let z = 0n;
  for (let i = 1; i < TREE_DEPTH; i++) {
    z = poseidon2([z, z]);        // ハッシュを階段状に計算
    elems.push(z);                // L1, L2, ...
  }
  return elems;                   // 例: [0, h1, h2]
})();

// ------------------------------------------------
// 証明生成 (メインスレ or Worker から呼び出し可能)
// ------------------------------------------------
export async function generateProofRaw(
  noteB64: string,
  rootHex: string,
  log: LogFn = () => {}
) {
  log('parse note');
  const note = JSON.parse(atob(noteB64)); // { n, s, idx }

  // nullifierHash = Poseidon(n)
  const nullifierHash = poseidon1([BigInt('0x' + note.n)]).toString();

  // ------- Groth16 回路入力 -------
  const input = {
    n: BigInt('0x' + note.n),
    s: BigInt('0x' + note.s),
    root: BigInt(rootHex),
    pathElements: ZERO_HASHES,             // 長さ 3
    pathIndices: Array(TREE_DEPTH).fill(0) // idx = 0 → 全て左
  };

  log('fullProve start');
  const { proof } = await groth16.fullProve(input, wasmUrl, zkeyUrl);
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