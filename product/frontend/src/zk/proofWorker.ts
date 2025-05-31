// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { LogFn } from '../utils/logger';

// WorkerArgs 型定義
type WorkerArgs = {
  noteB64: string;
  rootHex: string;
  leaves: string[];     // 先頭の葉を追加
  log: LogFn;           // log を追加
};

expose({
  // generate 関数に必要な引数を渡す
  generate: ({ noteB64, rootHex, leaves, log }: WorkerArgs) =>
    generateProofRaw(noteB64, rootHex, leaves, log),
});

// Worker 内エラーを UI へ転送
self.addEventListener('error', (e) =>
  (self as any).postMessage({ __log__: `ERROR ${e.message}` }),
);
self.addEventListener('unhandledrejection', (e: any) =>
  (self as any).postMessage({ __log__: `REJECTION ${e.reason}` }),
);
