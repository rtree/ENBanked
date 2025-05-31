// src/zk/index.ts
import { wrap } from 'comlink';
import WorkerFactory from './proofWorker?worker'; // runtime
import type { ProofResult } from './proofTypes';  // 型だけ

type WorkerApi = {
  generate(note: string, root: string): Promise<ProofResult>;
};

// wrap() は any 扱いで良いので as キャスト
export const generateProof = (wrap(new WorkerFactory()) as any)
  .generate as WorkerApi['generate'];
