// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// @dev For tests only
contract MonoStub is ERC20 {

    constructor() ERC20("MONO token", "MONO") {
        _mint(msg.sender, 100 * 10 ** decimals());
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
