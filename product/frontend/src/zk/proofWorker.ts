
// ===============================
// File: src/zk/proofWorker.ts (WebWorker)
// ===============================
import { expose } from 'comlink';
import { generateProofRaw } from './generateProof';
import type { LogFn } from '../utils/logger';

async function generate(note: string, root: string, log: LogFn = () => {}) {
  return generateProofRaw(note, root, log);
}

// エラーを UI へ転送
self.addEventListener('error', (e) => {
  (self as any).postMessage({ __log__: `ERROR ${e.message}` });
});
self.addEventListener('unhandledrejection', (e: any) => {
  (self as any).postMessage({ __log__: `REJECTION ${e.reason}` });
});

expose({ generate });