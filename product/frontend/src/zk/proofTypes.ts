// 共通の型をここに置く
export interface ProofResult {
  a: bigint[];
  b: bigint[][];
  c: bigint[];
  inputs: [string, string];   // [nullifierHash, root]
}
