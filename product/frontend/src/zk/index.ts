// ===============================
// File: src/zk/index.ts (Comlink wrapper)
// ===============================
import { wrap, proxy as comlinkProxy } from 'comlink';
import WorkerFactory from './proofWorker?worker';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

interface WorkerApi {
  generate(args: { noteB64: string, rootHex: string, leaves: string[], log: LogFn }): Promise<any>;
}

const worker = wrap(new WorkerFactory()) as unknown as WorkerApi;

/* React から呼ぶラッパー */
export function generateProof(args: ProofInput, log: LogFn) {
  return worker.generate({
    noteB64: args.noteB64,
    rootHex: args.rootHex,
    leaves: args.leaves,
    log: comlinkProxy(log), // proxyされたlogを渡す
  });
}
