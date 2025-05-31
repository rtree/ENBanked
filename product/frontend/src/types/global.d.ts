// 型が無い外部モジュールをざっくり any 扱いにする
declare module 'snarkjs';
declare module 'comlink';

// Vite で ``?worker`` インポートする時の型
declare module '*?worker' {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
