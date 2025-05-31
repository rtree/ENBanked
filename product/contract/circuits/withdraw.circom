pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template Withdraw() {
    signal input n;
    signal input s;
    signal input pathElements[3];
    signal input pathIndices[3];

    signal input root;

    signal output nHash;

    component leafH = Poseidon(2);
    leafH.inputs[0] <== n;
    leafH.inputs[1] <== s;
    var cur = leafH.out;

    component h[3];
    for (var i = 0; i < 3; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0;
        h[i] = Poseidon(2);
        h[i].inputs[0] <== IfElse()(pathIndices[i], pathElements[i], cur);
        h[i].inputs[1] <== IfElse()(pathIndices[i], cur, pathElements[i]);
        cur = h[i].out;
    }
    //cur === root;

    //component nH = Poseidon(1);
    //nH.inputs[0] <== n;
    //nHash <== nH.out;
    nHash <== cur;
}

template IfElse() {
  signal input cond;
  signal input ifTrue;
  signal input ifFalse;
  signal output out;
  
  out <== cond * (ifTrue - ifFalse) + ifFalse;
}

component main { public [root] } = Withdraw();

