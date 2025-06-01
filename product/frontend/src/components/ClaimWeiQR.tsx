// ===============================
// File: src/components/ClaimWeiQR.tsx
// ===============================
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { VAULT_ADDRESS, RPC_URL, MOCK_VAULT_ADDRESS } from '../config';
import { vaultFullAbi as vaultAbi, vaultWithdrawAbi } from '../abi/vaultZkWei';
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
function stringifyWithBigInt(obj) {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString(16) : value
  );
}

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
    logLine('📜 currentRoot =', BigInt(root).toString(10));
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
    let currentLevelLeaves = [...leaves]; // Start with the bottom-level leaves
let currentIndex = leafIndex;

for (let level = 0; level < 3; level++) {
  const siblingIndex = currentIndex ^ 1; // XOR to get sibling index
  pathIndices.push(currentIndex % 2);   // 0 for left, 1 for right
  pathElements.push(currentLevelLeaves[siblingIndex]);

  // Compute the parent level
  const nextLevelLeaves: string[] = [];
  for (let i = 0; i < currentLevelLeaves.length; i += 2) {
    const left = currentLevelLeaves[i];
    const right = currentLevelLeaves[i + 1];
    nextLevelLeaves.push(poseidonHex(left, right));
  }

  currentLevelLeaves = nextLevelLeaves; // Move to the next level
  currentIndex = Math.floor(currentIndex / 2);
}

    logLine('🛣️ pathIndices =', pathIndices);
    logLine('🛣️ pathElements =', pathElements);

try {
    var cur = leafBig;

    for (var i = 0; i < 3; i++) {
      if(pathIndices[i] === 0) {
        cur = poseidon([cur, pathElements[i]]);
      }else{
        cur = poseidon([pathElements[i], cur]);
      }
        // cur = poseidon([
        //   pathIndices[i] === 0 ? pathElements[i] : cur,
        //   pathIndices[i] === 1 ? cur : pathElements[i],
        // ])
            logLine('testRooooot', cur.toString(16), cur.toString());

    }
function _H(a:string,b:string){
  return poseidon([a, b]);
}
    const l0 = leaves;
        const l1 = new Array(4);
        const l2 = new Array(2);
        for (let i=0; i < 4; i++) l1[i] = _H(l0[2 * i], l0[2 * i + 1]);
        for (let i=0; i < 2; i++) l2[i] = _H(l1[2 * i], l1[2 * i + 1]);
        const currentRoot = _H(l2[0], l2[1]);
        logLine('level1', l1.map(x => x.toString(16)).join(', '));
        logLine('level2', l2.map(x => x.toString(16)).join(', '));
        logLine('currentRoot', currentRoot.toString(16), currentRoot.toString());
  } catch(e:any){
      return logLine('❌ Merkle path error:', e.stack, e.message);
}
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
      logLine(stringifyWithBigInt(proof));
      logLine('🔐 Proof done');
    } catch (e: any) {
      return logLine('💥 proof error:',  e.stack,  e.message);
    }

    const { a, b, c, inputs: [nullifierHash] } = proof;
    logLine('✅ proof OK (nullifierHash=', nullifierHash, ')');

    /* 5) nullifier 重複チェック ------------------------------------ */
    // if(await isNullifierSpent(nullifierHash))
    //   return logLine('❌ 既に使用済み nullifier');

    /* 6) withdraw 呼び出し ---------------------------------------- */
    // ... ここは以前のまま (省略) ...

  const mockWithdraw = async () => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: MOCK_VAULT_ADDRESS,
            abi: [
              {
                name: 'withdraw',
                inputs: [],
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            functionName: 'withdraw',
            args: [],
          },
        ],
      });

    } catch (err: any) {
      logLine('💥 Withdraw exception', err.stack || err.message || err);
    }
  };
    mockWithdraw();

//  try {
//     logLine('🔄 Sending withdraw transaction via MiniKit...');
//     const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
//       transaction: [
//         {
//           address: VAULT_ADDRESS,
//           abi: vaultWithdrawAbi,
//           functionName: 'withdraw',
//           args: [
//             a,
//             b,
//             c,
//             nullifierHash,
//             root,
//             MiniKit.user.walletAddress, 
//           ],
//         },
//       ],
//     });
//   } catch (e: any) {
//     //logLine('💥 MiniKit transaction error:', e.message);
//   }        
    
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
