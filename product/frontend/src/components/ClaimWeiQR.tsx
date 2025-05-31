import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { vaultWithdrawAbi as vaultAbi } from '../abi/vaultZkWei';
import { VAULT_ADDRESS } from '../config';
import { hexlify, randomBytes, zeroPadValue } from 'ethers';


/*  📌 WebWorker で SnarkyJS 証明を生成（重い処理）*/
declare function generateProof(note:string):Promise<{
  a:number[], b:number[][], c:number[],
  inputs:[string,string] /* [nullifierHash, root] */
}>;

export default function ClaimWeiQR() {
  const [noteBase64,setNote] = useState<string|null>(null);
  const [log,setLog] = useState('📭 log here');
  const logLine = (...a:any[])=>setLog(p=>p+'\n'+a.join(' '));

  /* URL パラメータから note を取得 */
  useEffect(()=>{
    const b64 = new URLSearchParams(window.location.search).get('note');
    if(b64){ setNote(b64); logLine('note loaded') }
  },[]);

  async function handleWithdraw(){
    if(!noteBase64){ logLine('note なし'); return; }
    if(!MiniKit.isInstalled()){ logLine('MiniKit 未検出'); return; }

    /* 1⃣ WebWorker で zk 証明生成 */
    const {a,b,c,inputs} = await generateProof(noteBase64);
    logLine('proof gen OK');

    /* 2⃣ MiniKit で withdraw トランザクション送信 */
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [{
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'withdraw',
        args: [
          [a[0],a[1]],
          [[b[0][0],b[0][1]],[b[1][0],b[1][1]]],
          [c[0],c[1]],
          inputs[0],           /* nullifierHash */
          inputs[1],           /* root */
          MiniKit.user.walletAddress
        ]
      }]
    });
    logLine('withdraw result',finalPayload.status);
  }

  if(!noteBase64) return <p>❌ note パラメータが見つかりません</p>;

  return (
    <div style={{margin:'1em'}}>
      <button onClick={handleWithdraw}>💰 1 wei 受け取る</button>
      <pre style={{background:'#111',color:'#0f0',padding:'1em',fontSize:12,maxHeight:200,overflowY:'auto'}}>{log}</pre>
    </div>
  );
}
