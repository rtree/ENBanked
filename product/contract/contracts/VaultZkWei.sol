// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "poseidon-solidity/PoseidonT3.sol";
import "./Verifier.sol";

contract VaultZkWei {
    uint256 public constant AMOUNT = 1;   // 1 wei
    PoseidonT3 poseidon = new PoseidonT3();

    bytes32[8] public leaves;   uint8 public nextIdx;
    bytes32 public currentRoot;
    mapping(bytes32=>bool) public nullifierUsed;

    event Deposited(bytes32 commitment,uint8 idx,bytes32 root);
    event Withdrawn(address to,bytes32 nullifierHash);

    /*---- deposit ----*/
    function deposit(bytes32 commitment) external payable {
        require(msg.value==AMOUNT,"need 1 wei");
        require(nextIdx<8,"tree full");

        leaves[nextIdx]=commitment;
        _recalcRoot();
        emit Deposited(commitment,nextIdx,currentRoot);
        nextIdx++;
    }

    /*---- withdraw ----*/
    function withdraw(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 nullifierHash,
        uint256 root,
        address payable to
    ) external {
        require(root==uint256(currentRoot),"bad root");
        bytes32 nh=bytes32(nullifierHash);
        require(!nullifierUsed[nh],"spent");

        require(Verifier.verifyProof(a,b,c,[root,nullifierHash]),"bad proof");
        nullifierUsed[nh]=true;
        (bool ok,) = to.call{value:AMOUNT}("");
        require(ok,"transfer fail");
        emit Withdrawn(to,nh);
    }

    /*---- internal ----*/
    function _recalcRoot() internal {
        bytes32[8] memory l0=leaves;
        bytes32[4] memory l1;
        bytes32[2] memory l2;
        for(uint8 i;i<4;i++) l1[i]=_H(l0[2*i],l0[2*i+1]);
        for(uint8 i;i<2;i++) l2[i]=_H(l1[2*i],l1[2*i+1]);
        currentRoot=_H(l2[0],l2[1]);
    }
    function _H(bytes32 a,bytes32 b) internal view returns(bytes32){
        return bytes32(poseidon.hash([uint256(a),uint256(b)]));
    }
    receive() external payable {}
}
