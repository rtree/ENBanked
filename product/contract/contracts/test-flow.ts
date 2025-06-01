// // test/flow.ts
// import {poseidon1 as poseidon} from 'poseidon-lite';
// import { ethers } from 'hardhat';

// it('deposit & withdraw 1 wei anonymously', async () => {
//   /* ▸ デプロイ */
//   const Vault = await ethers.getContractFactory('VaultZkWei');
//   const vault = await Vault.deploy();
//   await vault.waitForDeployment();

//   /* ▸ 雇い主が nullifier/secret 生成 */
//   const nullifier = ethers.randomBytes(32);
//   const secret    = ethers.randomBytes(32);
//   const commitment= poseidon([nullifier, secret]);

//   /* ▸ deposit(1 wei, commitment) */
//   await vault.deposit(commitment, { value: 1 });

//   /* ▸ QR に載せる情報を base64 化しコンソール出力 */
//   const qrObj = { n: Buffer.from(nullifier).toString('hex'),
//                   s: Buffer.from(secret).toString('hex'),
//                   idx: 0 };
//   console.log('QR ▶', Buffer.from(JSON.stringify(qrObj)).toString('base64'));

//   /* ▸ ★ここで receive 側が QR をスキャン→ withdraw.ts を実行★ */

//   /* ▸ withdraw.ts で生成された calldata.json を読む */
//   const { a,b,c,inputs } = JSON.parse(fs.readFileSync('calldata.json','utf8'));
//   await vault.withdraw(a,b,c,inputs[1],inputs[0],worker.address);

//   expect(await ethers.provider.getBalance(worker.address)).to.equal(1);
// });
