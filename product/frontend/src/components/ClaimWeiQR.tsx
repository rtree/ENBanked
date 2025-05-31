// ===============================
// File: src/components/ClaimWeiQR.tsx
// ===============================
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { VAULT_ADDRESS, RPC_URL } from '../config';
import { vaultFullAbi as vaultAbi } from '../abi/vaultZkWei';
import { Interface, JsonRpcProvider, ZeroAddress, toBeHex, zeroPadValue } from 'ethers';
import { poseidon2 as poseidon } from 'poseidon-lite';          // ★ Poseidonを直接読む
import { generateProofRaw } from '../zk/generateProof';
import { makeLogger } from '../utils/logger';

const provider   = new JsonRpcProvider(RPC_URL);
const vaultIface = new Interface(vaultAbi);

/* -------- read helpers -------- */
const read = async (fn: string, args: any[] = []) => {
  const data = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData(fn, args),
  });
  return vaultIface.decodeFunctionResult(fn, data)[0];
};
const getCurrentRoot   = () => read('currentRoot') as Promise<string>;
const getLeaf          = (i: number) => read('leaves', [i]) as Promise<string>;
const isNullifierSpent = (h: string) => read('nullifierUsed', [h]) as Promise<boolean>;

/* base64url → base64 */
const b64url2b64 = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/');

export default function ClaimWeiQR() {
  const [noteB64, setNote] = useState<string | null>(null);
  const [log,  setLog ]    = useState('📭 log here');
  const logLine = makeLogger(l => setLog(p => p + '\n' + l));

  /* --- note 取得 --- */
  useEffect(() => {
    const b64 = new URLSearchParams(window.location.search).get('note');
    if (b64) { setNote(b64); logLine('note loaded:', b64); }
  }, []);

  /* ---------- main ---------- */
  const handleWithdraw = async () => {
    logLine('🟢 handleWithdraw START');
    if (!noteB64)                 return logLine('❌ note なし');
    if (!MiniKit.isInstalled())   return logLine('❌ MiniKit 未検出');

    /* 0) note 解析 ------------------------------------------------- */
    let note:{n:string,s:string,idx:number};
    try {
      note = JSON.parse(atob(b64url2b64(noteB64)));
      logLine('🔍 note:', note);
    } catch(e:any){ return logLine('❌ note decode error:', e.message); }

    /* 1) チェーン情報取得 ----------------------------------------- */
    const [root, leaves] = await Promise.all([
      getCurrentRoot(),
      Promise.all([...Array(8)].map((_,i)=>getLeaf(i)))
    ]);
    logLine('📜 currentRoot =', root);
    for(let leaf of leaves){
 logLine('🗂️ leaves   =', leaf);
    }
   

    /* 2) leaf 再計算＆一致チェック ---------------------------------- */
    const leafBig = poseidon([BigInt('0x'+note.n), BigInt('0x'+note.s)]);
    const leafHex = zeroPadValue(toBeHex(leafBig), 32).toLowerCase();   // ★ 0x + 32byte
    logLine('🔨 calc leaf   =', leafHex);
    if(!leaves.includes(leafHex) ){
      logLine('❌ Leaf mismatch → 証明に進まず終了');
      return;
    }
    logLine('✅ Leaf matches on-chain');
    const leafIndex = leaves.indexOf(leafHex);

    /* 3) Merkle path 構築 ----------------------------------------- */
    // 動的に leafIndex に基づいて pathIndices と pathElements を構築
    const pathIndices: number[] = [];
    const pathElements: string[] = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < 3; level++) {
      const siblingIndex = currentIndex ^ 1; // XOR to get sibling index
      pathIndices.push(currentIndex % 2);   // 0 for left, 1 for right
      pathElements.push(leaves[siblingIndex]);

      // Move to the parent level
      currentIndex = Math.floor(currentIndex / 2);
    }

    logLine('🛣️ pathIndices =', pathIndices);
    logLine('🛣️ pathElements =', pathElements);

    /* 4) 証明生成 -------------------------------------------------- */
    let proof;
    try {
      logLine('🔄 generateProofRaw() 開始');
      proof = await generateProofRaw(
        noteB64,        // noteB64
        root,           // rootHex
        leaves,         // leaves
        leafIndex,      // leafIndex
        logLine         // log function
      );
      logLine('🔐 Proof done');
    } catch (e: any) {
      return logLine('💥 proof error:', e.message);
    }

    const { a, b, c, inputs: [nullifierHash] } = proof;
    logLine('✅ proof OK (nullifierHash=', nullifierHash, ')');

    /* 5) nullifier 重複チェック ------------------------------------ */
    if(await isNullifierSpent(nullifierHash))
      return logLine('❌ 既に使用済み nullifier');

    /* 6) withdraw 呼び出し ---------------------------------------- */
    // ... ここは以前のまま (省略) ...
  };

  /* ---------- UI ---------- */
  if(!noteB64) return <p>❌ note パラメータが見つかりません</p>;
  return (
    <div style={{margin:'1em',background:'#fff',padding:'1em',borderRadius:6}}>
      <button onClick={handleWithdraw}>💰 1 wei 受け取る</button>
      <pre style={{background:'#111',color:'#0f0',padding:'1em',fontSize:12,maxHeight:260,overflowY:'auto',whiteSpace:'pre-wrap'}}>{log}</pre>
    </div>
  );
}

/* ---------- ヘルパ ---------- */
function poseidonHex(a:string,b:string){
  const h = poseidon([BigInt(a),BigInt(b)]);
  return zeroPadValue(toBeHex(h),32);
}
