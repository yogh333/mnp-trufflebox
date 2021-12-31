// Mono.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract MonoContract is
    ERC20Capped,
    ERC20Burnable,
    ERC20Pausable,
    AccessControl
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev Sets the value of the max supply of token. This value is immutable, it can only be
     * set once during construction.
     */
    constructor(uint256 _cap) ERC20Capped(_cap) ERC20("MWMONO", "MONO") {
        _setupRole(ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(MINTER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setRoleAdmin(PAUSER_ROLE, ADMIN_ROLE);
    }

    function mint(address account, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(account, amount);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        super._pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        super._unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Pausable, ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _mint(address account, uint256 amount)
        internal
        override(ERC20Capped, ERC20)
    {
        super._mint(account, amount);
    }
}
