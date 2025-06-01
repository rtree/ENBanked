// SendETHCode.tsx
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useNotification, NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';
import QRCodeGenerator from './QRCodeGenerator';

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1';
const contractAddress = '0x4934C573FA9a8B72EA0325e20CfA4d72365045C2';

const SendETHCodeTrue = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [log, setLog] = useState('');
  const { openTxToast } = useNotification();

  const debug = (label: string, data?: any) => {
    const time = new Date().toISOString();
    const line = `[${time}] ${label}${data ? ': ' + JSON.stringify(data) : ''}`;
    setLog((prev) => prev + '\n' + line);
  };

  const sendDeposit = async () => {
    if (!MiniKit.isInstalled()) {
      debug('⚠️ MiniKit未検出。WorldAppから開いてください。');
      return;
    }

    try {
      debug('📡 Sending deposit transaction...');
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: [
              {
                name: 'deposit',
                inputs: [],
                outputs: [],
                stateMutability: 'payable',
                type: 'function',
              },
            ],
            functionName: 'deposit',
            args: [],
            value: '0x1', // 1 wei
          },
        ],
      });

      debug(`📦 MiniKit deposit result`, finalPayload);

      if (finalPayload.status === 'success') {
        setTransactionId(finalPayload.transaction_id);
        setWalletAddress(finalPayload.from);
        setTxHash(finalPayload.transaction_id);
        debug(`✅ Transaction successful: ${finalPayload.transaction_id}`);
      } else {
        debug('❌ Transaction failed', finalPayload);
      }
    } catch (err) {
      debug('💥 Deposit exception', err);
    }
  };

  const withdraw = async () => {
    if (!MiniKit.isInstalled()) {
      debug('⚠️ MiniKit未検出。WorldAppから開いてください。');
      return;
    }

    try {
      debug('📡 Sending withdraw transaction...');
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: contractAddress,
            abi: [
              {
                name: 'withdraw',
                inputs: [],
                outputs: [],
                stateMutability: 'nonpayable',
                type: 'function',
              },
            ],
            functionName: 'withdraw',
            args: [],
          },
        ],
      });

      debug(`📦 MiniKit withdraw result`, finalPayload);

      if (finalPayload.status === 'success') {
        setTransactionId(finalPayload.transaction_id);
        // setWalletAddress(finalPayload.to);
        setTxHash(finalPayload.transaction_id);
        debug(`✅ Withdrawal successful: ${finalPayload.transaction_id}`);
      } else {
        debug('❌ Withdrawal failed', finalPayload);
      }
    } catch (err) {
      debug('💥 Withdraw exception', err);
    }
  };

  return (
    <div>
      <button onClick={sendDeposit}>💸 Send 1 wei</button>
      <button onClick={withdraw} style={{ marginLeft: '10px' }}>🏦 Withdraw 1 wei</button>
      <p>
        {' Check your wallet by Blockscout:'}
        <a
          href={`https://worldchain-mainnet.explorer.alchemy.com/address/${walletAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          {walletAddress || 'No wallet address'}
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
  );
};

const WrappedSendETHCode = () => (
  <NotificationProvider>
    <TransactionPopupProvider>
      <SendETHCodeTrue />
    </TransactionPopupProvider>
  </NotificationProvider>
);

export default WrappedSendETHCode;
