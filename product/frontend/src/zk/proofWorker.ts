
// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

/* WorkerArgs 型を定義 */
type WorkerArgs = {
  note: { n: string; s: string; idx: number };  // noteB64 をデコードして得たオブジェクト
  rootHex: string;                             // rootHex を文字列として受け取る
  log: LogFn;                                  // log は進捗を表示する関数
};

expose({
  generate: ({ note, rootHex, log }: WorkerArgs) => 
    generateProofRaw(note, rootHex, log),
});

/* Worker 内エラーを UI へ転送 */
self.addEventListener('error', (e) =>
  (self as any).postMessage({ __log__: `ERROR ${e.message}` }),
);
self.addEventListener('unhandledrejection', (e: any) =>
  (self as any).postMessage({ __log__: `REJECTION ${e.reason}` }),
);