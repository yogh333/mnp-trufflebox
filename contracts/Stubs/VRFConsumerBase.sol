// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "../Board.sol";

// @dev only used for local development with Ganache
// @dev /!\ Vrf Coordinator address must be this one /!\
contract VRFConsumerBase /*ChainLinkVRFStub*/ is ERC20 { // https://github.com/rsksmart/erc677/blob/master/contracts/ERC677.sol
    /* keyHash */ /* nonce */
    mapping(bytes32 => uint256) private nonces;

    ERC20 LINK = ERC20(address(this));
    constructor(address _vrfCoordinator,
        address _link
    ) ERC20('Chainlink Token', 'LINK') {}

    // to create LINK
    function faucet(address recipient, uint amount) external {
        _mint(recipient, amount);
    }

    uint random;

    function setRandom(uint _newRandom) public {
        random = _newRandom;
    }

    function requestRandomness(
        bytes32 _keyHash,
        uint256 _fee
    )
    internal
    returns (
        bytes32 requestId
    ){

        requestId = 0x7465737400000000000000000000000000000000000000000000000000000000;
        uint256 randomness = random;

        // /!\ Vrf Coordinator address in Board contract must be this one /!\
        BoardContract Board = BoardContract(msg.sender);
        Board.rawFulfillRandomness(requestId, randomness);
    }

    function rawFulfillRandomness(bytes32 requestId, uint256 randomness) public virtual {}

}
