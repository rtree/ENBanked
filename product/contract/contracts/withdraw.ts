import { Field, MerkleTree, PrivateKey, Mina, Bool } from 'snarkyjs';
import { Withdraw, Path } from '../circuits/withdraw.circuit.ts';
import fs from 'fs';
import path from 'path';

/* 1) 秘密値を QR から復号 */
const { n, s, idx } = JSON.parse(Buffer.from(process.argv[2], 'base64').toString());
const nullifier = Field(BigInt('0x' + n));
const secret    = Field(BigInt('0x' + s));
const index     = Number(idx);

/* 2) 最新 root は on-chain から RPC で取得 (Hardhat/WorldChain) */
const VAULT = '0xYourDeployedVault';
const provider = Mina.JsonRpcProvider("https://rpc-url");
const rootOnChain = Field(await provider.getStorageAt(VAULT, 3)); // currentRoot slot=3

/* 3) ミニアプリローカルの MerkleTree を reconstruct */
const tree = new MerkleTree(3);
const leaves = await provider.getPastLogs({ address: VAULT, topics:[depositSig] });
for (let i=0;i<leaves.length;i++) { tree.setLeaf(i, Field(leaves[i].args.commitment)); }
const witness = new Path(tree.getWitness(index));

/* 4) 証明生成 */
await Withdraw.compile();                 // 初回だけ重い
const { proof, publicOutput } = await Withdraw.prove(
  nullifier, secret, witness, rootOnChain
);

/* 5) solidity calldata 出力 (a,b,c, inputs) */
const calldata = proof.toSolidity();
fs.writeFileSync(path.resolve('calldata.json'), JSON.stringify({
  ...calldata,
  inputs: [ publicOutput.root.toString(), publicOutput.nullifierHash.toString() ]
}));
console.log('✅ calldata.json 出力完了');
