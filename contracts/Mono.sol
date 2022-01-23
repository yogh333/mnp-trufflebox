// Mono.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

/**
 * @title $MONO ERC20 token contract
 * @notice This is the project token.
 * @notice Is capped, burnable, pausable and have an access control.
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
contract MonoContract is ERC20Capped, ERC20Burnable, ERC20Pausable, AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

	/** @dev Constructor
	 * @dev ADMIN_ROLE, MINTER_ROLE and PAUSER_ROLE are given to deployer
	 * @param _cap Sets the value of the max supply of token. This value is immutable, it can only be set once during construction.*/
	constructor(uint256 _cap) ERC20Capped(_cap) ERC20("MWMONO", "MONO") {
		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
		_setupRole(PAUSER_ROLE, msg.sender);
		_setRoleAdmin(PAUSER_ROLE, ADMIN_ROLE);
	}

	/** mint $MONO token to an address
	 * @param account destination address
	 * @param amount quantity of tokens to be minted*/
	function mint(address account, uint256 amount) external onlyRole(MINTER_ROLE) {
		_mint(account, amount);
	}

	/** pause token transfers, minting and burning*/
	function pause() external onlyRole(ADMIN_ROLE) {
		super._pause();
	}

	/** unpause token transfers, minting and burning*/
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

	function _mint(address account, uint256 amount) internal override(ERC20Capped, ERC20) {
		super._mint(account, amount);
	}
}
