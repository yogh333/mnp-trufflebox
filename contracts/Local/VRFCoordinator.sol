// VRFCoordinator.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../Board.sol";

// @dev only used for local development with Ganache
contract VRFCoordinatorContract {
    BoardContract Board;
    mapping(bytes32 => uint256) randomnessByRequestID;

    constructor() {}

    function saveData(bytes32 requestId, uint256 randomness, address BoardAddress) external {
        randomnessByRequestID[requestId] = randomness;
        Board = BoardContract(BoardAddress);
    }

    function sendRandomness(bytes32 requestId) external {
        Board.rawFulfillRandomness(requestId, randomnessByRequestID[requestId]);
    }
}