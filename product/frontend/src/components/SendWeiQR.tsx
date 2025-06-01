// PRJROOT/product/frontend/src/components/SendWeiQR.tsx
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { QRCodeSVG } from 'qrcode.react';
import { vaultDepositAbi as vaultAbi  } from '../abi/vaultZkWei';
import { poseidon2 as poseidon } from 'poseidon-lite';
import { VAULT_ADDRESS, APP_ID, AMOUNT_HEX } from '../config';
import { toBeHex, hexlify, randomBytes, zeroPadValue } from 'ethers';

type NoteInfo = { n: string; s: string; idx: number };

export default function SendWeiQR() {
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [log, setLog] = useState('📭 log here');

  /* ========== 共通ログ関数 ========== */
  const logLine = (...parts: any[]) => {
    const time = new Date().toISOString().slice(11, 19); // HH:MM:SS
    const line =
      `[${time}] ` +
      parts
        .map((p) =>
          typeof p === 'string' ? p : JSON.stringify(p, null, 2)
        )
        .join(' ');
    setLog((prev) => prev + '\n' + line);
    console.debug(line); // DevTools にも出す
  };

  /* ========== メイン処理 ========== */
  async function handleDeposit() {
    logLine('🟢 handleDeposit START');

    /* 0) MiniKit 有無チェック */
    if (!MiniKit.isInstalled()) {
      logLine('⛔ MiniKit 未検出：WorldApp から開いてください');
      return;
    }

    setWaiting(true);
    try {
      /* 1.Generating secret */
      logLine('🔑 秘密値生成中…');
      const nullifier = hexlify(randomBytes(31)); // 248-bit
      const secret = hexlify(randomBytes(31));
      logLine('   nullifier =', nullifier);
      logLine('   secret    =', secret);

      /* 2.commitment を計算 */
      logLine('🔄 Poseidon( nullifier , secret ) calculating...');
      // const commitmentBig = poseidon([BigInt(nullifier), BigInt(secret)]);
      // const commitmentHex = zeroPadValue(
      //   '0x' + commitmentBig.toString(16),
      //   32
      // );
      const commitmentBig = poseidon([BigInt(nullifier), BigInt(secret)]);
      const commitmentHex = zeroPadValue(toBeHex(commitmentBig), 32);

      logLine('   • commitment =', commitmentHex);

      /* 3) MiniKit 経由で deposit TX */
      logLine('📡 トランザクション送信要求を MiniKit に送信…');
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: 'deposit',
            args: [commitmentHex],
            value: AMOUNT_HEX,
          },
        ],
      });

      logLine('📩 MiniKit 応答:', finalPayload);
      if (finalPayload.status !== 'success') {
        logLine('❌ 送金失敗: ', finalPayload.status);
        return;
      }

      /* 4) leaf index を決める（デモでは 0 に固定）*/
      const idx = 0;
      const noteInfo: NoteInfo = {
        n: nullifier.slice(2),
        s: secret.slice(2),
        idx,
      };
      setNote(noteInfo);
      setTxid(finalPayload.transaction_id);
      logLine('✅ Successfully done TxID=', finalPayload.transaction_id);
      logLine('✅ QR Note =', noteInfo);
    } catch (err) {
      if (err instanceof Error) {
        logLine('💥 Exception', err.message);
      } else {
        logLine('💥 Exception', JSON.stringify(err));
      }
    } finally {
      setWaiting(false);
      logLine('🔚 handleDeposit END');
    }
  }

  /* ========== 表示 ========== */
  if (!note)
    return (
      <div style={{ margin: '1em' }}>
        <button onClick={handleDeposit} disabled={waiting}>
          {waiting ? '⏳ Sending…' : '💸 Convert Crypto to QR '}
        </button>

      <p>
        {' Check your wallet by Blockscout:'}<img src="https://docs.blockscout.com/~gitbook/image?url=https%3A%2F%2F1077666658-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-Lq1XoWGmy8zggj_u2fM%252Ficon%252FyFkt6mPJJvjKiSBBOppe%252FBS_logo_slack.png%3Falt%3Dmedia%26token%3D3bbbb670-528a-4c2b-aec8-f149bd5e059f&width=16&dpr=2&quality=100&sign=393be4b0&sv=2"/><br />
        {' wallet:'}
        <a
          href={`https://worldchain-mainnet.explorer.alchemy.com/address/${MiniKit.user.walletAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          {`https://worldchain-mainnet.explorer.alchemy.com/address/${MiniKit.user.walletAddress}`}
        </a>
      </p>

        <pre
          style={{
            background: '#111',
            color: '#0f0',
            padding: '1em',
            fontSize: 12,
            maxHeight: 250,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {log}
        </pre>
      </div>
    );

  const qr = btoa(JSON.stringify(note));
  const claimUrl = `https://worldcoin.org/mini-app?app_id=${APP_ID}&path=${encodeURIComponent(
    `/claim?note=${qr}`
  )}`;

  return (
    <div style={{ margin: '1em' }}>
      <p>✅ <b>TxID:</b> {txid}</p>
      <p>👇 pass QR to recipients</p>
      <QRCodeSVG value={claimUrl} size={180} />
      <p>
        <a href={claimUrl}>{claimUrl}</a>
      </p>
      <pre
        style={{
          background: '#111',
          color: '#0f0',
          padding: '1em',
          fontSize: 12,
          maxHeight: 250,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {log}
      </pre>
    </div>
  );
}
