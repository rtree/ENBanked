// SendETHCode.tsx
import { useState, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import { useNotification, NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk'
import QRCodeGenerator from './QRCodeGenerator'

const contractAddress = '0xd7C2a36786124738d54AdB710D59abc8d8CAca75'

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

const SendETHCode = () => {
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

  const generateCode = () => {
    const raw = Math.floor(Math.random() * 10000)
    setCode(raw)
    debug('🎲 code generated', raw)
    return raw
  }

  const sendDeposit = async () => {
    if (!MiniKit.isInstalled()) {
      debug('⚠️ MiniKit未検出。WorldAppから開いてください。')
      return
    }

    const generatedCode = generateCode()

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: vaultAbi,
            functionName: 'deposit',
            args: [],
            value: '0x1',
          },
        ],
      })

      debug(`📦 MiniKit deposit result`, finalPayload)

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
      debug('💥 deposit例外', err)
    }
  }

  const claimUrl = code !== null
    ? `https://worldcoin.org/mini-app?app_id=app_c22b23e8101db637591586c4a8ca02b1&path=/claim?code=${code}`
    : ''

  return (
    <div>
      <button onClick={sendDeposit}>💸 Send + QR発行</button>

      {code !== null && walletAddress &&(
        <QRCodeGenerator code={code} claimUrl={claimUrl} />
      )}
      <p>
        Check your wallet by Blockscout:<br />
        {' wallet:'}
        <a
          href={`https://worldchain-mainnet.explorer.alchemy.com/address/${walletAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          {`https://worldchain-mainnet.explorer.alchemy.com/address/${walletAddress}`}
        </a>
      </p>
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

const WrappedSendETHCode = () => (
  <NotificationProvider>
    <TransactionPopupProvider>
      <SendETHCode />
    </TransactionPopupProvider>
  </NotificationProvider>
)

export default WrappedSendETHCode
