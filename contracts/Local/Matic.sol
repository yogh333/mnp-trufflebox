// Matic.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// @dev only used for local development with Ganache
contract Matic is ERC20 {
    constructor() ERC20('Matic Token', 'MATIC') {}

    // to create MATIC
    function faucet(address recipient, uint amount) external {
        _mint(recipient, amount);
    }
}