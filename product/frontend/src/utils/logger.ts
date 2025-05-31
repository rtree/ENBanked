// src/utils/logger.ts
export type LogFn = (msg: string, ...rest: any[]) => void;

export function makeLogger(append: (l: string) => void): LogFn {
  return (msg, ...rest) => {
    const line =
      `[${new Date().toISOString().slice(11, 19)}] ` +
      [msg, ...rest]
        .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
        .join(' ');
    append(line);
  };
}