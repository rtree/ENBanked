// ===============================
// File: src/components/ClaimWeiQR.tsx
// ===============================
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { VAULT_ADDRESS, RPC_URL } from '../config';
import { vaultFullAbi as vaultAbi } from '../abi/vaultZkWei';
import { Interface, JsonRpcProvider, ZeroAddress } from 'ethers';
import { generateProofRaw } from '../zk/generateProof';  // Worker 経由を排除
import { makeLogger } from '../utils/logger';
import { poseidon2 as poseidon } from 'poseidon-lite';

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

/* base64url → base64 変換関数 */
function base64urlToBase64(base64url: string): string {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}

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

    // note を解析する
    let note;
    try {
      const decodedNote = atob(base64urlToBase64(noteB64)); // base64urlをbase64に変換してから
      note = JSON.parse(decodedNote); // ここでJSONパース
      logLine('🔍 Decoded note:', note);  // Note内容のログを追加
    } catch (e: unknown) {
      const error = e as Error;
      return logLine('❌ note の解析に失敗:', error.message || error);
    }

    const idxFromNote = Number(note.idx);
    if (Number.isNaN(idxFromNote)) return logLine('❌ note に idx 無し');
    logLine('🔑 note idx:', idxFromNote);

    // 必要データを並列取得
    const [root, leaves] = await Promise.all([
      getCurrentRoot(),
      Promise.all([...Array(8)].map((_, i) => getLeaf(i).then((l) => String(l)))),
    ]);
    logLine('📜 currentRoot:', root);
    logLine('🗂️ leaves[0]:', leaves[0]);

    // Poseidonでleaf計算
    const leaf = poseidon([BigInt(note.n), BigInt(note.s)]);
    logLine('🔨 Poseidon leaf calculation:', leaf);
    if (String(leaf) !== leaves[0]) {
      logLine('❌ Leaf mismatch: Calculated leaf does not match leaves[0]');
      return;
    } else {
      logLine('✅ Leaf matches leaves[0]');
    }

    // 証明生成
    let proof;
    try {
      logLine('🔄 Generating proof...');
      proof = await generateProofRaw(
        noteB64, root, leaves, logLine // 同期的に証明生成
      );
      logLine('🔐 Proof generated successfully:', proof);
    } catch (e: any) {
      return logLine('💥 proof error:', e.message || e);
    }
    const { a, b, c, inputs } = proof;
    const [nullifierHash] = inputs;
    logLine('✅ proof OK');
    logLine('🧾 a:', a);
    logLine('🔢 b:', b);
    logLine('🔑 c:', c);
    logLine('📝 inputs:', inputs);

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

    logLine('💡 Encoded calldata:', calldata);

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
