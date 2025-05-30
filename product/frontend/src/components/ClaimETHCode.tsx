// ClaimETHCode.tsx
import { useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { useNotification, NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1'
const contractAddress = '0x78242F5BF2b44CcedCb601FF81cF2743AE4f9341'

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
    inputs: [
      {
        internalType: 'uint16',
        name: 'code',
        type: 'uint16',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const ClaimETHCode = () => {
  const [code, setCode] = useState<number | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [log, setLog] = useState('')
  const { openTxToast } = useNotification()

  const debug = (label: string, data?: any) => {
    const time = new Date().toISOString()
    const line = `[${time}] ${label}${data ? ': ' + JSON.stringify(data) : ''}`
    setLog((prev) => prev + '\n' + line)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeParam = params.get('code')
    if (codeParam && !isNaN(Number(codeParam))) {
      const parsed = parseInt(codeParam, 10)
      setCode(parsed)
      debug('🔍 code from URL', parsed)
    } else {
      debug('⚠️ URLに有効なcodeが見つかりません')
    }
  }, [])

  const sendWithdraw = async () => {
    if (!MiniKit.isInstalled()) {
      debug('⚠️ MiniKit未検出。WorldAppから開いてください。')
      return
    }

    if (code === null) {
      debug('❌ コードが設定されていません')
      return
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: vaultAbi,
            functionName: 'withdraw',
            args: [code],
          },
        ],
      })

      debug(`📦 MiniKit withdraw result`, finalPayload)

      if (finalPayload.status === 'success') {
        setTransactionId(finalPayload.transaction_id)
        setWalletAddress(finalPayload.from)
        setTxHash(null)
        debug(`✅ transaction_id 取得`, finalPayload.transaction_id)
        // await openTxToast('480', finalPayload.transaction_hash)
      } else {
        debug('❌ トランザクション送信失敗', finalPayload)
      }
    } catch (err) {
      debug('💥 withdraw例外', err)
    }
  }

  return (
    <div>
      <button onClick={sendWithdraw} disabled={code === null}>💰 Claim</button>
      {code !== null}
      {walletAddress && (
        <p> 
          {' Check your wallet by Blockscout:'}<img src='https://docs.blockscout.com/~gitbook/image?url=https%3A%2F%2F1077666658-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Lq1XoWGmy8zggj_u2fM%252Ficon%252FyFkt6mPJJvjKiSBBOppe%252FBS_logo_slack.png%3Falt%3Dmedia%26token%3D3bbbb670-528a-4c2b-aec8-f149bd5e059f&width=16&dpr=2&quality=100&sign=393be4b0&sv=2'/>
          <a
            href={`https://worldchain-mainnet.explorer.alchemy.com/address/${walletAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            {walletAddress}
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

const WrappedClaimETHCode = () => (
  <NotificationProvider>
    <TransactionPopupProvider>
      <ClaimETHCode />
    </TransactionPopupProvider>
  </NotificationProvider>
)

export default WrappedClaimETHCode
