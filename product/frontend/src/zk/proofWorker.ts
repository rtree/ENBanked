
// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

/*―――― ★ ここを追加 ――――*/
type WorkerArgs = ProofInput & { log: LogFn };
/*――――――――――――――――――――*/

expose({
  generate: ({ noteB64, rootHex, log }: WorkerArgs) =>
    generateProofRaw(noteB64, rootHex, log),
});

/* Worker 内エラーを UI へ転送 */
self.addEventListener('error', (e) =>
  (self as any).postMessage({ __log__: `ERROR ${e.message}` }),
);
self.addEventListener('unhandledrejection', (e: any) =>
  (self as any).postMessage({ __log__: `REJECTION ${e.reason}` }),
);