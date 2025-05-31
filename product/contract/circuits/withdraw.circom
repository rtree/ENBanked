pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";

template Withdraw() {
  signal input n;                        // nullifier     (private)
  signal input s;                        // secret        (private)
  signal input pathElements[3];          // Merkle 隣接   (private)
  signal input pathIndices[3];           // 0 or 1        (private)
  signal input root;                     // MerkleRoot    (public)
  signal output nHash;                   // nullifierHash (public)

  component h1 = Poseidon(2);            // commitment = H(n,s)
  h1.inputs[0] <== n; h1.inputs[1] <== s;
  var leaf = h1.out;

  var cur = leaf;
  for (var i=0; i<3; i++) {
    component h = Poseidon(2);
    h.inputs[0] <== pathIndices[i] == 0 ? cur            : pathElements[i];
    h.inputs[1] <== pathIndices[i] == 0 ? pathElements[i]: cur;
    cur <== h.out;
  }
  cur === root;                          // Merkle 検証

  component h2 = Poseidon(1);            // nHash = H(n)
  h2.inputs[0] <== n;
  nHash <== h2.out;
}
component main { public [root, nHash] } = Withdraw();

