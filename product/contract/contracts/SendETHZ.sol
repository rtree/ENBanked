// SPDX-License-Identifier: MITAdd commentMore actions
pragma solidity ^0.8.19;

contract SendETHZ {
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    function deposit() external payable {
        require(msg.value == 1, "Deposit must be exactly 1 wei");
        emit Deposited(msg.sender, 1);
    }

    function withdraw() external {
        (bool sent, ) = msg.sender.call{value: 1}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(msg.sender, 1);
    }

    // optional: allow contract to receive ETH (if needed)
    receive() external payable {}
}