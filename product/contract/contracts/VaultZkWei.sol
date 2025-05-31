// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*------------------------------------------------------------
 ▸ PoseidonT3 は StarkWare 公開実装をそのまま import
   npm i poseidon-solidity で取得可能
 ------------------------------------------------------------*/
import "poseidon-solidity/PoseidonT3.sol";

/**
 * @title VaultZkWei
 * @notice 1 wei の匿名クーポンを発行・回収する最小実装
 *         - deposit : 1 wei と commitment を送る
 *         - withdraw: Groth16 証明 (a,b,c) + [root, nullifierHash] を渡す
 */
contract VaultZkWei {
    /*======================================================
        定数／状態
    ======================================================*/
    uint256 public constant AMOUNT = 1;          // 1 wei 固定
    uint8   public constant DEPTH  = 3;          // ツリー深さ (2^3 = 8 枚まで)

    // Poseidon ハッシュ計算用ライブラリ
    PoseidonT3 poseidon = new PoseidonT3();

    bytes32[8] public leaves;                    // 最大 8 枚の葉
    uint8 public nextIndex = 0;                  // 次に書く leaf の index
    bytes32 public currentRoot;                  // 最新ルート

    mapping(bytes32 => bool) public nullifierUsed;

    /*======================================================
        Events
    ======================================================*/
    event Deposited(bytes32 commitment, uint8 index, bytes32 newRoot);
    event Withdrawn(address to, bytes32 nullifierHash);

    /*======================================================
        Deposit (1 wei + commitment)
    ======================================================*/
    function deposit(bytes32 commitment) external payable {
        require(msg.value == AMOUNT, "Need 1 wei");
        require(nextIndex < 8,         "Tree full");

        uint8 index = nextIndex;
        leaves[index] = commitment;
        nextIndex    += 1;

        // ---- ルート再計算（深さ 3 固定なので手計算で十分） ----
        // L0: 葉 (8 個) → L1: 4 個 → L2: 2 個 → L3: 1 (root)
        bytes32[8] memory l0;
        for (uint8 i; i < 8; i++) l0[i] = leaves[i];

        bytes32[4] memory l1;
        for (uint8 i; i < 4; i++) l1[i] = _hashPair(l0[2*i], l0[2*i+1]);

        bytes32[2] memory l2;
        for (uint8 i; i < 2; i++) l2[i] = _hashPair(l1[2*i], l1[2*i+1]);

        currentRoot = _hashPair(l2[0], l2[1]);
        emit Deposited(commitment, index, currentRoot);
    }

    /*======================================================
        Withdraw (Groth16 証明)
    ======================================================*/
    function withdraw(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256   nullifierHash,
        uint256   root,
        address   to
    ) external {
        require(root == uint256(currentRoot), "old root");
        bytes32 nh = bytes32(nullifierHash);
        require(!nullifierUsed[nh], "spent");

        // (a,b,c) + publicInputs[0]=root, [1]=nullifierHash
        // ---- 自動生成した Groth16 Verifier を呼ぶ ----
        require(Verifier.verifyProof(a, b, c, [root, nullifierHash]), "bad proof");

        nullifierUsed[nh] = true;
        payable(to).transfer(AMOUNT);
        emit Withdrawn(to, nh);
    }

    /*======================================================
        Utils
    ======================================================*/
    function _hashPair(bytes32 left, bytes32 right) internal view returns (bytes32) {
        return bytes32(poseidon.hash([uint256(left), uint256(right)]));
    }

    // 受け取り
    receive() external payable {}
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ▸ Groth16 の標準 verifier （circom/snarkjs が生成するコード）
   verifer.sol を貼り付けるだけで OK。ここでは省略。
   - 生成例:
     snarkjs zkey export solidityverifier withdraw_final.zkey \
       contracts/Verifier.sol
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
import "./Verifier.sol";
