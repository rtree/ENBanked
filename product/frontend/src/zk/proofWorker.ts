
// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { ProofInput } from './generateProof';

expose({
  generate: (args: ProofInput) => generateProofRaw(args),
});

/* Worker 内エラーを UI へ転送 */
self.addEventListener('error', (e) =>
  (self as any).postMessage({ __log__: `ERROR ${e.message}` }),
);
self.addEventListener('unhandledrejection', (e: any) =>
  (self as any).postMessage({ __log__: `REJECTION ${e.reason}` }),
);
