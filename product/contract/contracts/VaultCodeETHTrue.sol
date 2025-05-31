// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VaultCodeETHTrue {
    event CodeCreated(address indexed from, uint16 code);
    event CodeClaimed(address indexed to, uint16 code);

    mapping(uint16 => address) public codeOwner;
    mapping(uint16 => bool) public codeUsed;

    /// @notice フロントエンドからコードを渡す方式に変更（Reactが生成する）
    function deposit(uint16 code) external payable {
        require(msg.value == 1, "Must send exactly 1 wei");
        require(code < 10000, "Code must be 4 digits");
        require(codeOwner[code] == address(0), "Code already used");

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
