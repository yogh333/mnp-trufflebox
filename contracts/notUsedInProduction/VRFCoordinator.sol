// VRFCoordinator.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../Board.sol";

// @dev only used for local development with Ganache
contract VRFCoordinatorContract {
    BoardContract Board;
    mapping(bytes32 => uint256) randomnessByRequestID;
    bytes32 lastRequestID;

    constructor() {}

    function saveData(bytes32 requestId, uint256 randomness, address BoardAddress) external {
        randomnessByRequestID[requestId] = randomness;
        lastRequestID = requestId;
        Board = BoardContract(BoardAddress);
    }

    function sendRandomness(bytes32 requestId) external {
        Board.rawFulfillRandomness(requestId, randomnessByRequestID[requestId]);
    }

    function getLastRequestID() public view returns (bytes32) {
        return lastRequestID;
    }

    function getLastRandomness() public view returns (uint256) {
        return randomnessByRequestID[lastRequestID];
    }
}