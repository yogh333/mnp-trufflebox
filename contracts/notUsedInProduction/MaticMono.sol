// MaticMono.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// @dev only used for local development with Ganache
contract MaticMono is ERC20 {
    constructor() ERC20('Matic Mono LP', 'MATIC-MONO') {}

    // to create MATIC
    function faucet(address recipient, uint amount) external {
        _mint(recipient, amount);
    }
}