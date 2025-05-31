// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VaultCodeETH {
    event CodeCreated(address indexed from, uint16 code);
    event CodeClaimed(address indexed to, uint16 code);

    mapping(uint16 => address) public codeOwner;
    mapping(uint16 => bool) public codeUsed;

    function deposit() external payable {
        require(msg.value == 1, "Must send exactly 1 wei");

        // ランダム4桁コード（0000〜9999）
        uint16 code = uint16(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % 10000);
        require(codeOwner[code] == address(0), "Code collision, try again");

        codeOwner[code] = msg.sender;

        emit CodeCreated(msg.sender, code);
    }

    function withdraw(uint16 code) external {
        require(codeOwner[code] != address(0), "Invalid code");
        require(!codeUsed[code], "Code already used");

        codeUsed[code] = true;
        payable(msg.sender).transfer(1);

        emit CodeClaimed(msg.sender, code);
    }

    receive() external payable {}
}
// This contract allows users to deposit 1 wei and receive a unique 4-digit code.
// They can later withdraw 1 wei by providing the code, ensuring it hasn't been used before.
// The contract emits events for code creation and claiming, allowing tracking of actions.
// The code is generated using a hash of the current block timestamp, sender address, and block number to ensure randomness.
// The contract also includes a receive function to accept ETH deposits directly.