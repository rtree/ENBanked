// ===============================
// File: src/components/ClaimWeiQR.tsx
// ===============================
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { VAULT_ADDRESS, RPC_URL } from '../config';
import { vaultFullAbi as vaultAbi } from '../abi/vaultZkWei';
import { Interface, JsonRpcProvider, ZeroAddress } from 'ethers';
import { generateProof } from '../zk';  // Worker ラッパ (args, log) 形式
import { makeLogger } from '../utils/logger';

const provider = new JsonRpcProvider(RPC_URL);
const vaultIface = new Interface(vaultAbi);

/* -------- read-only helpers -------- */
const read = async (fn: string, args: any[] = []) => {
  const data = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData(fn, args),
  });
  return vaultIface.decodeFunctionResult(fn, data)[0];
};
const getCurrentRoot = () => read('currentRoot') as Promise<string>;
const getNextIdx = async () => Number(await read('nextIdx'));
const getLeaf = (i: number) => read('leaves', [i]) as Promise<string>;
const isNullifierSpent = (h: string) => read('nullifierUsed', [h]) as Promise<boolean>;

export default function ClaimWeiQR() {
  const [noteB64, setNote] = useState<string | null>(null);
  const [log, setLog] = useState('📭 log here');
  const logLine = makeLogger((l) => setLog((p) => p + '\n' + l));

  /* URL から note を取得 */
  useEffect(() => {
    const b64 = new URLSearchParams(window.location.search).get('note');
    if (b64) {
      setNote(b64);
      logLine('note loaded:', b64);
    }
  }, []);

  /* ---------- main ---------- */
  const handleWithdraw = async () => {
    logLine('🟢 handleWithdraw START');
    if (!noteB64) return logLine('❌ note なし');
    if (!MiniKit.isInstalled()) return logLine('❌ MiniKit 未検出');

    /* note 解析 (n,s,idx) */
    const note = JSON.parse(atob(noteB64));
    const idxFromNote = Number(note.idx);
    if (Number.isNaN(idxFromNote)) return logLine('❌ note に idx 無し');

    /* 必要データを並列取得 */
    const [root, leaves] = await Promise.all([
      getCurrentRoot(),
      Promise.all([...Array(8)].map((_, i) => getLeaf(i).then((l) => String(l)))), // 文字列化
    ]);

    logLine('currentRoot =', root);
    logLine('idx =', idxFromNote);

    /* ---------- 証明生成 ---------- */
    let proof;
    try {
      proof = await generateProof(
        { noteB64, rootHex: root, idx: idxFromNote, leaves },
        logLine // ← Worker に proxy され進捗転送
      );
    } catch (e: any) {
      return logLine('💥 proof error:', e.message || e);
    }
    const { a, b, c, inputs } = proof;
    const [nullifierHash] = inputs;
    logLine('✅ proof OK');

    if (await isNullifierSpent(nullifierHash))
      return logLine('❌ 既に使用済み');

    /* ---------- withdraw calldata ---------- */
    const calldata = vaultIface.encodeFunctionData('withdraw', [
      [a[0], a[1]],
      [
        [b[0][0], b[0][1]],
        [b[1][0], b[1][1]],
      ],
      [c[0], c[1]],
      nullifierHash,
      root,
      MiniKit.user.walletAddress ?? ZeroAddress,
    ]);

    /* 事前シミュレーション */
    try {
      await provider.call({ to: VAULT_ADDRESS, data: calldata });
      logLine('🧪 eth_call ✅');
    } catch (e: any) {
      return logLine('🧪 eth_call ❌', e.reason || e.message || e);
    }

    /* ---------- MiniKit 送信 ---------- */
    logLine('🚀 sending tx via MiniKit…');
    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: VAULT_ADDRESS,
          abi: vaultAbi,
          functionName: 'withdraw',
          args: [
            [a[0], a[1]],
            [
              [b[0][0], b[0][1]],
              [b[1][0], b[1][1]],
            ],
            [c[0], c[1]],
            nullifierHash,
            root,
            MiniKit.user.walletAddress,
          ],
        },
      ],
    });

    if (finalPayload.status !== 'success')
      return logLine('❌ MiniKit error', JSON.stringify(finalPayload));

    const txHash = finalPayload.transaction_id;
    logLine('⏳ waiting for receipt…', txHash.slice(0, 10), '…');

    const receipt = await provider.waitForTransaction(txHash, 1, 40_000);
    if (!receipt) return logLine('💥 tx timeout / not found');
    if (receipt.status !== 1) return logLine('💥 tx reverted; status =', receipt.status);

    logLine('🎉 confirmed in block', receipt.blockNumber);
  };

  /* ---------- UI ---------- */
  if (!noteB64) return <p>❌ note パラメータが見つかりません</p>;

  return (
    <div style={{ margin: '1em', backgroundColor: 'white', padding: '1em', borderRadius: '6px' }}>
      <button onClick={handleWithdraw}>💰 1 wei 受け取る</button>
      <pre
        style={{
          background: '#111', color: '#0f0',
          padding: '1em', fontSize: 12,
          maxHeight: 260, overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {log}
      </pre>
    </div>
  );
}
