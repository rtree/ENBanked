// ===============================
// File: src/zk/index.ts (Comlink wrapper)
// ===============================
import { wrap, proxy as comlinkProxy } from 'comlink';
import WorkerFactory from './proofWorker?worker';
import type { LogFn } from '../utils/logger';
import type { ProofResult } from './proofTypes';

// Worker API 型定義
interface WorkerApi {
  generate(
    note: string,
    root: string,
    log: LogFn
  ): Promise<ProofResult>;
}
const worker = wrap(new WorkerFactory()) as unknown as WorkerApi;

/**
 * note + root から証明を生成。WebWorker 内で行われる。
 * 第3引数にログ関数を渡すと Worker 側からリアルタイムで呼ばれる。
 */
export function generateProof(
  note: string,
  root: string,
  log: LogFn = () => {}
) {
  // log を Comlink の proxy でラップ
  return worker.generate(note, root, comlinkProxy(log));
}
