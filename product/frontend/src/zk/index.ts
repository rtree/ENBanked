// ===============================
// File: src/zk/index.ts (Comlink wrapper)
// ===============================
import { wrap, proxy as comlinkProxy } from 'comlink';
import WorkerFactory from './proofWorker?worker';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

interface WorkerApi {
  generate(args: ProofInput & { log: LogFn }): Promise<any>;
}

const worker = wrap(new WorkerFactory()) as unknown as WorkerApi;

/* React から呼ぶラッパー */
export function generateProof(args: ProofInput, log: LogFn) {
  return worker.generate({ ...args, log: comlinkProxy(log) });
}
