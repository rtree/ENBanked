//PRJROOT/product/frontend/src/abi/vaultZkWei.ts


/* ───────── Mock 用（MiniKit に渡すのはこれだけ） ───────── */


/* ───────── SendETHZ ABI ───────── */
export const sendETHZAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdrawn',
    type: 'event',
  },
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const;


/* ───────── Deposit 用（MiniKit に渡すのはこれだけ） ───────── */
export const vaultDepositAbi = [
  {
    name: 'deposit',
    inputs: [{ name: 'commitment', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
] as const;

/* ───────── Withdraw 用 ───────── */
export const vaultWithdrawAbi = [
  {
    name: 'withdraw',
    inputs: [
      { name: 'a',  type: 'uint256[2]' },
      { name: 'b',  type: 'uint256[2][2]' },
      { name: 'c',  type: 'uint256[2]' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'root',          type: 'uint256' },
      { name: 'to',            type: 'address' }      // ← payable を外す
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export const vaultFullAbi = [
  /*----- Constructor -----*/
  {
    inputs: [{ internalType: 'address', name: 'verifierAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
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
      { name: 'a', type: 'uint256[2]' },
      { name: 'b', type: 'uint256[2][2]' },
      { name: 'c', type: 'uint256[2]' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'root', type: 'uint256' },
      { name: 'to', type: 'address payable' }
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  /*----- AMOUNT (view) -----*/
  {
    inputs: [],
    name: 'AMOUNT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  /*----- currentRoot (view) -----*/
  {
    inputs: [],
    name: 'currentRoot',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  /*----- leaves (view) -----*/
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'leaves',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  /*----- nextIdx (view) -----*/
  {
    inputs: [],
    name: 'nextIdx',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  /*----- nullifierUsed (view) -----*/
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'nullifierUsed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  /*----- Deposited Event -----*/
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'bytes32', name: 'commitment', type: 'bytes32' },
      { indexed: false, internalType: 'uint8', name: 'idx', type: 'uint8' },
      { indexed: false, internalType: 'bytes32', name: 'root', type: 'bytes32' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  /*----- Withdrawn Event -----*/
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'nullifierHash', type: 'bytes32' }
    ],
    name: 'Withdrawn',
    type: 'event'
  },
  /*----- Receive Function -----*/
  {
    stateMutability: 'payable',
    type: 'receive'
  }
] as const;
