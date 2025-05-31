import {
  Field, Poseidon, Bool, Circuit, UInt64, MerkleWitness, method
} from 'snarkyjs';

/* Merkle 深さ 3 の Witness クラスを自動生成 */
class Path extends MerkleWitness(3) {}

/* Withdrawal 回路 */
export class Withdraw extends Circuit {
  @method static prove(
    nullifier: Field,
    secret: Field,
    path: Path,
    root: Field
  ) {
    /* 1 ▶ commitment = H(nullifier, secret) */
    const commitment = Poseidon.hash([nullifier, secret]);

    /* 2 ▶ メルクルパス検証 */
    path.calculateRoot(commitment).assertEquals(root);

    /* 3 ▶ nullifierHash を公開 (return) */
    const nullifierHash = Poseidon.hash([nullifier]);
    // Circuit の公開出力として nullifierHash と root を返す
    return { nullifierHash, root };
  }
}
