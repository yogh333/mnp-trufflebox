// PawnStub.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// @dev For tests only
contract PawnStub is ERC721Enumerable, AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	mapping(address => uint256) playerToPawn;

	constructor() ERC721("pawn", "PAWN") {
		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
	}

	function tokenURI(uint256 _id) public view override returns (string memory) {
		return "https://server.com/pawn/";
	}

	function mint(address _to) external onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(playerToPawn[_to] == 0, "player already owns a pawn");

		id_ = generateID(_to);

		playerToPawn[_to] = id_;

		_safeMint(_to, id_);
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		override(ERC721Enumerable, AccessControl)
		returns (bool)
	{
		return super.supportsInterface(_interfaceId);
	}

	function generateID(address player) internal view returns (uint256 id_) {
		return uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, player)));
	}
}
