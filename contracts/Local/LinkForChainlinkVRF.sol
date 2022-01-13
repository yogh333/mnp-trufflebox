// LinkForChainLinkVRF.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "../Board.sol";
import "./VRFCoordinator.sol";

// @dev only used for local development with Ganache
contract LinkForChainlinkVRF is ERC20 { // https://github.com/rsksmart/erc677/blob/master/contracts/ERC677.sol
    VRFCoordinatorContract VRFCoordinator;

    /* keyHash */ /* nonce */
    mapping(bytes32 => uint256) private nonces;


    constructor(address VRFCoordinatorAddress) ERC20('Chainlink Token', 'LINK') {
        VRFCoordinator = VRFCoordinatorContract(VRFCoordinatorAddress);
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

        // Randomness is calculated here, by simplicity, but is not important.
        // msg.sender is Board contract
        VRFCoordinator.saveData(requestId, randomness, msg.sender);

        return true;
    }
}