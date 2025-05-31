import { useState } from 'react';
import { MiniKit }   from '@worldcoin/minikit-js';
import { QRCodeSVG } from 'qrcode.react';
import { vaultAbi }  from '../abi/vaultZkWei';
import { poseidon1 as poseidon }  from 'poseidon-lite';
import { VAULT_ADDRESS, APP_ID, AMOUNT_HEX, TREE_DEPTH } from '../config';
import { hexlify, randomBytes, zeroPadValue } from 'ethers';

type NoteInfo = { n: string; s: string; idx: number };

export default function SendWeiQR() {
  const [note, setNote]     = useState<NoteInfo|null>(null);
  const [txid, setTxid]     = useState<string|null>(null);
  const [log , setLog ]     = useState<string>('📭 log here');

  const logLine = (...args:any[]) =>
    setLog(p=>p+'\n'+args.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '));

  async function handleDeposit() {
    if (!MiniKit.isInstalled()) { logLine('MiniKit 未検出'); return; }

    /* 1⃣ 秘密値ランダム生成 */
    const nullifier = hexlify(randomBytes(31));   // 248-bit
    const secret    = hexlify(randomBytes(31));
    
    /* 2⃣ commitment = Poseidon(nullifier,secret) */
    const commitment = poseidon([BigInt(nullifier), BigInt(secret)]);
    const commitmentHex = zeroPadValue('0x' + commitment.toString(16), 32);

    /* 3⃣ MiniKit 経由で deposit Tx */
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [{
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: 'deposit',
        args: [commitmentHex],
        value: AMOUNT_HEX
      }]
    });

    logLine('deposit result', finalPayload);
    if (finalPayload.status !== 'success') return;

    /* 4⃣ leaf index は Deposited イベントから取得 */
    const idx = 0; // ←簡易版: ツリーが浅いので 0〜7 を手動で管理しても OK
                   //   本番は RPC でイベントを取得して動的に設定

    const noteInfo:NoteInfo = { n: nullifier.slice(2), s: secret.slice(2), idx };
    setNote(noteInfo);
    setTxid(finalPayload.transaction_id);
  }

  if (!note) return <button onClick={handleDeposit}>💸 1 wei を預けて QR 作成</button>;

  const qr = btoa(JSON.stringify(note));           // base64
  const claimUrl = `https://worldcoin.org/mini-app?app_id=${APP_ID}&path=${encodeURIComponent(`/claim?note=${qr}`)}`;

  return (
    <div style={{margin:'1em'}}>
      <p>✅ TxID: {txid}</p>
      <p>👇 QR を労働者に渡してください</p>
      <QRCodeSVG value={claimUrl} size={180}/>
      <p><a href={claimUrl}>{claimUrl}</a></p>
      <pre style={{background:'#111',color:'#0f0',padding:'1em',fontSize:12,maxHeight:200,overflowY:'auto'}}>{log}</pre>
    </div>
  );
}
