// ===============================
// File: src/components/ClaimWeiQR.tsx
// ===============================
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { VAULT_ADDRESS, RPC_URL } from '../config';
import { vaultWithdrawAbi as vaultAbi } from '../abi/vaultZkWei';
import { Interface, JsonRpcProvider, ZeroAddress } from 'ethers';
import { proxy } from 'comlink';
import { generateProof } from '../zk'; // クライアント側ラッパ (wrap 版)
import { makeLogger } from '../utils/logger';

const provider = new JsonRpcProvider(RPC_URL);
const vaultIface = new Interface(vaultAbi);

async function getCurrentRoot() {
  const data = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData('currentRoot', []),
  });
  const [root] = vaultIface.decodeFunctionResult('currentRoot', data);
  return root as string;
}

async function isNullifierSpent(nullifierHash: string) {
  const data = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData('nullifierUsed', [nullifierHash]),
  });
  const [spent] = vaultIface.decodeFunctionResult('nullifierUsed', data);
  return spent as boolean;
}

async function simulateWithdraw(calldata: string) {
  await provider.call({ to: VAULT_ADDRESS, data: calldata });
}

export default function ClaimWeiQR() {
  const [noteBase64, setNote] = useState<string | null>(null);
  const [log, setLog] = useState('📭 log here');
  const logLine = makeLogger((l) => setLog((p) => p + '\n' + l));

  // note 取得
  useEffect(() => {
    const b64 = new URLSearchParams(window.location.search).get('note');
    if (b64) {
      setNote(b64);
      logLine('note loaded: b64:', b64);
    }
  }, []);

  async function handleWithdraw() {
    logLine('🟢 handleWithdraw START');
    if (!noteBase64) return logLine('❌ note なし');
    if (!MiniKit.isInstalled()) return logLine('❌ MiniKit 未検出');

    // 1. root 取得
    logLine('🌳 Merkle root 取得開始');
    let chainRoot: string;
    try {
      chainRoot = await getCurrentRoot();
      logLine('   • currentRoot =', chainRoot);
    } catch (e: any) {
      return logLine('💥 getCurrentRoot error:', e.message || e);
    }

    // 2. proof 生成 (Worker)
    let proof;
    try {
      proof = await generateProof(noteBase64, chainRoot, proxy(logLine));
    } catch (e: any) {
      return logLine('💥 generateProof error:', e.message || e);
    }
    const { a, b, c, inputs } = proof;
    const [nullifierHash, root] = inputs;
    logLine('✅ proof OK');

    // 3. チェーン状態チェック
    if (chainRoot !== root) logLine('⚠️ root mismatch!');
    const spent = await isNullifierSpent(nullifierHash);
    logLine('nullifierUsed =', spent);
    if (spent) return logLine('❌ 既に使用済み');

    // 4. シミュレーション
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
    try {
      await simulateWithdraw(calldata);
      logLine('🧪 eth_call ✅');
    } catch (err: any) {
      return logLine('🧪 eth_call ❌', err.reason || err.message);
    }

    // 5. MiniKit 送信
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

    // 6. confirm
    const receipt = await provider.waitForTransaction(txHash, 1, 40_000);
    if (!receipt) return logLine('💥 tx timeout / not found');
    if (receipt.status !== 1)
      return logLine('💥 tx reverted; status =', receipt.status);

    logLine('🎉 confirmed in block', receipt.blockNumber);
    logLine('🔚 handleWithdraw END');
  }

  if (!noteBase64) return <p>❌ note パラメータが見つかりません</p>;

  return (
    <div style={{ margin: '1em' }}>
      <button onClick={handleWithdraw}>💰 1 wei 受け取る</button>
      <pre
        style={{
          background: '#111',
          color: '#0f0',
          padding: '1em',
          fontSize: 12,
          maxHeight: 240,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {log}
      </pre>
    </div>
  );
}
