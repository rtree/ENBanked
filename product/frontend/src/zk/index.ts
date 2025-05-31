// ===============================
// File: src/zk/index.ts (Comlink wrapper)
// ===============================
import { wrap, proxy as comlinkProxy } from 'comlink';
import WorkerFactory from './proofWorker?worker';
import type { ProofInput } from './generateProof';
import type { LogFn } from '../utils/logger';

const worker = wrap(new WorkerFactory()) as any;

export function generateProof(args: {
  noteB64: string;
  rootHex: string;
  log: (msg: string) => void;
}) {
  const note = JSON.parse(atob(args.noteB64));
  return worker.generate({
    note,
    rootHex: args.rootHex,
    log: comlinkProxy(args.log),
  });
}