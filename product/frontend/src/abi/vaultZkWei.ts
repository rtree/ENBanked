export const vaultAbi = [
  /*----- deposit(bytes32 commitment) payable -----*/
  {
    inputs: [{ internalType: 'bytes32', name: 'commitment', type: 'bytes32' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  /*----- withdraw(a,b,c,nullifierHash,root,to) -----*/
  {
    inputs: [
      { name: 'a',  type: 'uint256[2]' },
      { name: 'b',  type: 'uint256[2][2]' },
      { name: 'c',  type: 'uint256[2]'   },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'root',          type: 'uint256' },
      { name: 'to',            type: 'address' }
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  /*----- events (Deposit / Withdrawn) -----*/
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'commitment', type: 'bytes32' },
      { indexed: false, internalType: 'uint8',   name: 'index',      type: 'uint8'   },
      { indexed: false, internalType: 'bytes32', name: 'newRoot',    type: 'bytes32' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: 'address', name: 'to',            type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'nullifierHash', type: 'bytes32' }
    ],
    name: 'Withdrawn',
    type: 'event'
  }
] as const;
