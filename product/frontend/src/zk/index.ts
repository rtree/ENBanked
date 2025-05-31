// ===============================
// File: src/zk/index.ts (Comlink wrapper)
// ===============================
import { wrap, proxy as comlinkProxy } from 'comlink';
import WorkerFactory from './proofWorker?worker';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

interface WorkerApi {
  generate(noteB64: string, rootHex: string, idx: number, leaves: string[]): Promise<any>;
}

const worker = wrap(new WorkerFactory()) as unknown as WorkerApi;

/* React から呼ぶラッパー */
export function generateProof(args: ProofInput, log: LogFn) {
  log('💬 generateProof args:', args);
  return worker.generate(args.noteB64, args.rootHex, args.idx, args.leaves);
}
