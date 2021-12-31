// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Rogue is ERC20 {

    address private timonier;
    address private forban;
    address private owner;

    constructor() ERC20("MP swap Token", "MPS") {
        owner = msg.sender;
    }

    modifier onlyMinter() {
        require(msg.sender == timonier || msg.sender == forban, "minting is not enable");
        _;
    }

    function mint(address to, uint256 amount) public onlyMinter{
        _mint(to, amount);
    }

    function allow(address masterchef, address staking) public{
        require(owner == msg.sender,"only owner can call this method");
        timonier = staking;
        forban = masterchef;

    }
}