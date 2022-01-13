// LinkForChainLinkVRF.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "../Board.sol";

// @dev only used for local development with Ganache
// @dev /!\ Vrf Coordinator address must be this one /!\
contract LinkForChainlinkVRF is ERC20 { // https://github.com/rsksmart/erc677/blob/master/contracts/ERC677.sol
    /* keyHash */ /* nonce */
    mapping(bytes32 => uint256) private nonces;
    ERC20 public LINK;
    
    constructor() ERC20('Chainlink Token', 'LINK') {
  }

    // to create LINK
    function faucet(address recipient, uint amount) external {
        _mint(recipient, amount);
    }

    function transferAndCall(
        address to,
        uint256 value,
        bytes memory data
    ) external returns (bool) {
        (bytes32 _keyHash,uint256 _userSeed) = abi.decode(data, (bytes32, uint256));
        uint256 vRFSeed = uint256(keccak256(abi.encode(_keyHash, _userSeed, msg.sender, nonces[_keyHash])));
        nonces[_keyHash] = nonces[_keyHash] + 1;
        bytes32 requestId = keccak256(abi.encodePacked(_keyHash, vRFSeed));

        uint256 randomness = uint256(keccak256(abi.encodePacked(_keyHash, vRFSeed, value, to)));

        // /!\ Vrf Coordinator address in Board contract must be this one /!\
        BoardContract Board = BoardContract(msg.sender);
        Board.rawFulfillRandomness(requestId, randomness);

        return true;
    }
}