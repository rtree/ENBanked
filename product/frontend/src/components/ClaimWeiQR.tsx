import { useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { VAULT_ADDRESS, RPC_URL } from '../config'
import { vaultWithdrawAbi as vaultAbi } from '../abi/vaultZkWei'
import { Interface, JsonRpcProvider, ZeroAddress } from 'ethers'
declare function generateProof(note: string): Promise<{
  a: bigint[];            // ← bigint 推奨
  b: bigint[][];
  c: bigint[];
  inputs: [string, string];  // [nullifierHash, root]
}>;
/* 0) ethers provider 準備（WorldChain メインネット） */
const provider = new JsonRpcProvider(RPC_URL)

/* 1) 補助: コントラクト read / simulate / wait */
const vaultIface = new Interface(vaultAbi)

async function getCurrentRoot() {
  const [root] = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData('currentRoot', []),
  })
  return root
}

async function isNullifierSpent(nullifierHash: string) {
  const [spent] = await provider.call({
    to: VAULT_ADDRESS,
    data: vaultIface.encodeFunctionData('nullifierUsed', [nullifierHash]),
  })
  return spent === '0x01'
}

async function simulateWithdraw(calldata: string) {
  // eth_call -> 成功なら何も返って来ない / 失敗なら例外
  await provider.call({ to: VAULT_ADDRESS, data: calldata })
}

export default function ClaimWeiQR() {
  const [noteBase64, setNote] = useState<string | null>(null)
  const [log, setLog] = useState('📭 log here')
  const logLine = (...a: any[]) =>
    setLog((p) => p + '\n' + a.map(String).join(' '))

  /* URL パラメータから note を取得 */
  useEffect(() => {
    const b64 = new URLSearchParams(window.location.search).get('note')
    if (b64) {
      setNote(b64)
      logLine(`note loaded: b64: ${b64}`)
    }
  }, [])

  async function handleWithdraw() {
    logLine('🟢 handleWithdraw START (button clicked)');
    if (!noteBase64) return logLine('❌ note なし')
    if (!MiniKit.isInstalled()) return logLine('❌ MiniKit 未検出')

    /* 1️⃣ 証明生成（WebWorker）------------------------------------ */
    logLine('🌳 Merkle root 取得開始');
    const { a, b, c, inputs } = await generateProof(noteBase64)
    const [nullifierHash, root] = inputs
    logLine('✅ proof OK')

    /* 2️⃣ チェーン状態チェック -------------------------------------- */
    const chainRoot = await getCurrentRoot()
    logLine('chainRoot =', chainRoot.slice(0, 10), '…')
    if (chainRoot !== root) logLine('⚠️ root mismatch!')

    const spent = await isNullifierSpent(nullifierHash)
    logLine('nullifierUsed =', spent)
    if (spent) return logLine('❌ 既に使用済み')

    /* 3️⃣ withdraw をシミュレート ---------------------------------- */
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
    ])
    try {
      await simulateWithdraw(calldata)
      logLine('🧪 eth_call ✅')
    } catch (err: any) {
      return logLine('🧪 eth_call ❌', err.reason || err.message)
    }finally {
      logLine('🔚 handleWithdraw END');
    }

    /* 4️⃣ MiniKit で送信 ------------------------------------------ */
    logLine('🚀 sending tx via MiniKit…')
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
    })

    if (finalPayload.status !== 'success')
      return logLine('❌ MiniKit error', finalPayload)

    const txHash = finalPayload.transaction_id
    logLine('⏳ waiting for receipt…', txHash.slice(0, 10), '…')

    /* 5️⃣ confirm ------------------------------------------------- */
    const receipt = await provider.waitForTransaction(txHash, 1, 40_000)
    // ① null チェック
    if (!receipt) {
      logLine('💥 tx timeout / not found')
      return
    }

    // ② status 比較は number で
    if (receipt.status !== 1) {
      logLine('💥 tx reverted; status =', receipt.status)
      return
    }

    logLine('🎉 confirmed in block', receipt.blockNumber)
  }

  if (!noteBase64)
    return <p>❌ note パラメータが見つかりません</p>

  return (
    <div style={{ margin: '1em' }}>
      <button
       onClick={() => { logLine('🖱️ click'); handleWithdraw(); }}       
       >💰 1 wei 受け取る</button>
      <pre
        style={{
          background: '#111',
          color: '#0f0',
          padding: '1em',
          fontSize: 12,
          maxHeight: 240,
          overflowY: 'auto',
        }}
      >
        {log}
      </pre>
    </div>
  )
}
