// // ===============================
// // File: src/zk/proofWorker.ts (WebWorker)
// // ===============================
// import { expose } from 'comlink';
// import { generateProofRaw } from './generateProof';
// import type { LogFn } from '../utils/logger';

// // WorkerArgs 型定義
// type WorkerArgs = {
//   noteB64: string;
//   rootHex: string;
//   leaves: string[];     // 先頭の葉を追加
//   log: LogFn;           // log を追加
// };

// expose({
//   generate(args: {
//     noteB64: string;
//     rootHex: string; 
//     leaves: string[];
//     log: (msg: string) => void; // ← ここは proxy された log を受け取れるように関数型で OK
//   }) {
//     return generateProofRaw(args.noteB64, args.rootHex, args.leaves, args.log);
//   }
// });

// // Worker 内エラーを UI へ転送
// self.addEventListener('error', (e) =>
//   (self as any).postMessage({ __log__: `ERROR ${e.message}` }),
// );
// self.addEventListener('unhandledrejection', (e: any) =>
//   (self as any).postMessage({ __log__: `REJECTION ${e.reason}` }),
// );
