import { ethers } from 'hardhat';
import { poseidon } from 'poseidon-lite';

describe('VaultZkWei demo', ()=>{
  it('deposit & withdraw 1 wei', async ()=>{
    const [owner,worker] = await ethers.getSigners();
    const Vault = await ethers.getContractFactory('VaultZkWei');
    const vault = await Vault.deploy();

    /* deposit */
    const nullifier = ethers.randomBytes(31);
    const secret    = ethers.randomBytes(31);
    const commBn= poseidon([BigInt(nullifier),BigInt(secret)]);
    const commitment = ethers.hexZeroPad('0x'+commBn.toString(16),32);
    await vault.deposit(commitment,{value:1});

    /* ここで witness & proof を JS 側で生成 …省略 */

    /* withdraw (ダミー) */
    // await vault.withdraw(a,b,c,nullifierHash,root,worker.address);

  });
});
