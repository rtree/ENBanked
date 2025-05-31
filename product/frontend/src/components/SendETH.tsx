import { useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1'

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

const WORLD_CHAIN_PARAMS = {
  chainId: '0x1e0', // 480
  chainName: 'World Chain',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/v2/yYqkQNEKuzDKgYc35KTC35iwZ9oHRy3u'],
  blockExplorerUrls: ['https://worldchain-mainnet.explorer.alchemy.com/'],
}

const blockExplorerBase = WORLD_CHAIN_PARAMS.blockExplorerUrls[0].replace(/\/$/, '')

const getTxExplorerUrl = (txHash: string) =>
  `${blockExplorerBase}/tx/${txHash}`

const SendETH = () => {
  const [txHash, setTxHash] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [log, setLog] = useState('')

  const debug = (label: string, data?: any) => {
    const time = new Date().toISOString()
    const line = `[${time}] ${label}${data ? ': ' + JSON.stringify(data) : ''}`
    setLog(prev => prev + '\n' + line)
  }

  const sendTx = async (action: 'deposit' | 'withdraw') => {
    debug(`⏳ ${action}開始`)
    const isMiniApp = MiniKit.isInstalled()
    const valueInWei = '0x1'

    if (!isMiniApp) {
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
            value: action === 'deposit' ? valueInWei : undefined,
          },
        ],
      })

      debug(`📦 MiniKit ${action} result`, finalPayload)

      if (finalPayload.status === 'success') {
        setTransactionId(finalPayload.transaction_id)
        setWalletAddress(finalPayload.from)
        setTxHash(null)
        debug(`✅ transaction_id 取得`, finalPayload.transaction_id)
      } else {
        debug(`❌ トランザクション送信失敗`, finalPayload)
      }
    } catch (err) {
      debug(`💥 MiniKit ${action}例外`, err)
    }
  }

  const fetchTransactionHash = async (txId: string) => {
    const query = `https://developer.worldcoin.org/api/v2/minikit/transaction/${txId}?app_id=${APP_ID}&type=transaction`
    try {
      const response = await fetch(query)
      const data = await response.json()
      debug(`🔍 txHash取得:${data.transactionHash}, query:${query}`, data.transactionHash)
      setTxHash(data.transactionHash)
    } catch (error) {
      debug(`❌ txHash取得失敗:${query}`, error)
    }
  }


  useEffect(() => {
    if (transactionId) {
      fetchTransactionHash(transactionId)
    }
  }, [transactionId])
  return (
    <div>
      <button onClick={() => sendTx('deposit')}>💸 Send</button>
      <button onClick={() => sendTx('withdraw')} style={{ marginLeft: '1rem' }}>
        💰 Receive
      </button>
        <p>
          Check wallet by Blockscout:<br/>
          {' contract:'}
          <a
            href={`https://worldchain-mainnet.explorer.alchemy.com/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            {`https://worldchain-mainnet.explorer.alchemy.com/address/${contractAddress}`}
          </a><br/>
          {` myaddr:${walletAddress}`}
        </p>
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
        {log || '📭 Log is here'}
      </pre>
    </div>
  )
}

export default SendETH
