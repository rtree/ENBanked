import { useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react'
import { http, createPublicClient } from 'viem'
import { worldchain } from 'viem/chains'

const vaultAbi = [
  {
    name: 'deposit',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    name: 'withdraw',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const contractAddress = '0x76D72a4bf89Bb2327759826046FabE9BDA884E8B'
const blockExplorerBase = 'https://worldchain-mainnet.explorer.alchemy.com'

const getTxExplorerUrl = (txHash: string) => `${blockExplorerBase}/tx/${txHash}`

const client = createPublicClient({
  chain: worldchain,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
})

const SendETH = () => {
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [log, setLog] = useState('')

  const debug = (label: string, data?: any) => {
    const time = new Date().toISOString()
    const line = `[${time}] ${label}${data ? ': ' + JSON.stringify(data) : ''}`
    setLog(prev => prev + '\n' + line)
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed, error } = useWaitForTransactionReceipt({
    client,
    appConfig: {
      app_id: import.meta.env.VITE_APP_ID || '',
    },
    transactionId: transactionId || '',
  })

  // 成功時の副作用
  useEffect(() => {
    if (isConfirmed) {
      debug('✅ トランザクション成功')
      // TxHashは useWaitForTransactionReceipt の返り値からは直接取得できない場合が多いので
      // 必要なら MiniKit の返り値や他のAPIから取得してください
    }
  }, [isConfirmed])

  // エラー時の副作用
  useEffect(() => {
    if (error) {
      debug('💥 トランザクション失敗', error)
    }
  }, [error])

  const sendTx = async (action: 'deposit' | 'withdraw') => {
    debug(`⏳ ${action} 開始`)
    if (!MiniKit.isInstalled()) {
      debug('⚠️ MiniKit未検出。World Appから開いてください。')
      return
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: vaultAbi,
            functionName: action,
            args: [],
            value: action === 'deposit' ? '0x1' : undefined,
          },
        ],
      })

      if (finalPayload.status === 'success') {
        setTransactionId(finalPayload.transaction_id)
        debug(`📦 transaction_id`, finalPayload.transaction_id)
      } else {
        debug(`❌ トランザクションエラー`, finalPayload)
      }
    } catch (err) {
      debug(`💥 MiniKit 送信失敗`, err)
    }
  }

  return (
    <div>
      <button onClick={() => sendTx('deposit')}>💸 預ける</button>
      <button onClick={() => sendTx('withdraw')} style={{ marginLeft: '1rem' }}>
        💰 受け取る
      </button>

      {isConfirming && <p>🔄 トランザクション確認中...</p>}
      {txHash && (
        <p>
          TxHash:{' '}
          <a href={getTxExplorerUrl(txHash)} target="_blank" rel="noreferrer">
            {txHash}
          </a>
        </p>
      )}

      <pre
        style={{
          backgroundColor: '#111',
          color: '#0f0',
          fontSize: '12px',
          padding: '1em',
          marginTop: '1em',
          borderRadius: '6px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {log || '📭 ログはここに表示されます'}
      </pre>
    </div>
  )
}

export default SendETH
