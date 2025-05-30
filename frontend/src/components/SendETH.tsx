import React, { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
const SendETH = () => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
  };

  return (
    <div>
      <h2>Send ETH</h2>
      <input
        type="text"
        placeholder="Recipient Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default SendETH
