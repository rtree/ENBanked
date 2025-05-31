// ===============================
// File: src/zk/generateProof.ts
// ===============================
import { groth16 } from 'snarkjs';
import { poseidon1, poseidon2 } from 'poseidon-lite';
import wasmUrl from './withdraw_js/withdraw.wasm?url';
import zkeyUrl from './withdraw_final.zkey?url';
import type { LogFn } from '../utils/logger';

const TREE_DEPTH = 3;   // VaultZkWei は固定深さ 3

export type ProofInput = {
  noteB64: string;
  rootHex: string;
  idx: number;        // leaf index
  leaves: string[];   // bytes32 hex strings, length 8
  log?: LogFn;
};

/* --- Merkle パスを計算（深さ 3）--- */
function buildMerklePath(idx: number, leaves: string[]) {
  const elems: bigint[] = [];
  const indices: number[] = [];

  /* Level-0 ―― 兄弟リーフ */
  elems.push(BigInt(leaves[idx ^ 1]));
  indices.push(idx & 1);

  /* Level-1 ―― 4 枚 → 2 枚のハッシュ */
  const l1: bigint[] = [];
  for (let i = 0; i < 4; i++) {
    l1.push(poseidon2([BigInt(leaves[2 * i]), BigInt(leaves[2 * i + 1])]));
  }
  elems.push(l1[(idx >> 1) ^ 1]);
  indices.push((idx >> 1) & 1);

  /* Level-2 ―― 2 枚 → root */
  const leftRoot  = poseidon2([l1[0], l1[1]]);
  const rightRoot = poseidon2([l1[2], l1[3]]);
  elems.push(((idx >> 2) & 1) === 0 ? rightRoot : leftRoot);
  indices.push((idx >> 2) & 1);

  return { pathElements: elems, pathIndices: indices };
}

/* --- 証明生成メイン --- */
export async function generateProofRaw(
  { noteB64, rootHex, idx, leaves, log = () => {} }: ProofInput,
) {
  log('parse note');
  const note = JSON.parse(atob(noteB64));

  if (idx < 0 || idx >= 8)        throw new Error('idx out of range');
  if (leaves.length !== 8)        throw new Error('leaves array must be length 8');

  const { pathElements, pathIndices } = buildMerklePath(idx, leaves);
  const nullifierHash = poseidon1([BigInt('0x' + note.n)]).toString();

  const input = {
    n:   BigInt('0x' + note.n),
    s:   BigInt('0x' + note.s),
    root: BigInt(rootHex),
    pathElements,
    pathIndices,
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
