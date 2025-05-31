
// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
// File: src/zk/proofWorker.ts
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { LogFn } from '../utils/logger';

type WorkerArgs = {
  noteB64: string;
  rootHex: string;
  leaves: string[];     // ← 追加！
  log: LogFn;
};

expose({
  generate: ({ noteB64, rootHex, leaves, log }: WorkerArgs) =>
    generateProofRaw(noteB64, rootHex, leaves, log), // ← leaves を渡す
});
