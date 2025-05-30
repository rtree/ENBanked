import { useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
//
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
  //const { openTxToast } = useNotification()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [minikitResult, setMinikitResult] = useState<any>(null) // Add this state
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

    if (isMiniApp) {
      debug('🌐 MiniApp環境（MiniKit使用）')
      try {
        const result = await MiniKit.commandsAsync.sendTransaction({
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
        debug(`📦 MiniKit ${action} result`, result)
        setMinikitResult(result) // Store the result for BlockScoutTxStatus
        setTxHash(null) // Clear txHash, since BlockScoutTxStatus will resolve it
      } catch (err) {
        debug(`💥 MiniKit ${action}例外`, err)
      }
    } else {
      setMinikitResult(null) // Clear minikitResult for MetaMask
    }
  }

  return (
    <div>
      <button onClick={() => sendTx('deposit')}>
        💸 預ける
      </button>
      <button onClick={() => sendTx('withdraw')} style={{ marginLeft: '1rem' }}>
        💰 受取り
      </button>

      {(txHash || minikitResult) && (
        <>
          {txHash && (
            <p>
              TxHash:{' '}
              <a href={getTxExplorerUrl(txHash)} target="_blank" rel="noreferrer">
                {txHash}
              </a>
            </p>
          )}
        </>
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
