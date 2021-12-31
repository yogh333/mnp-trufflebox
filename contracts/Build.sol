// Build.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

import "./Board.sol";

contract BuildContract is ERC1155Supply, AccessControl {
	struct Building {
		// version number
		uint16 edition;
		// id of the cell of board
		uint8 land;
		// build type: e.g. 0 -> house, 1 -> hotel, 2 -> hotel
		uint8 buildType;
	}

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	BoardContract private immutable Board;

	mapping(uint256 => Building) private builds;
	mapping(uint16 => mapping(uint8 => uint256[])) private buildIdByLandByEdition;

	constructor(address BoardAddress, string memory _uri) ERC1155(_uri) {
		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);

		Board = BoardContract(BoardAddress);
	}

	function isValidBuild(
		uint16 edition,
		uint8 land,
		uint8 buildType
	) public view returns (bool) {
		return
		(edition <= Board.getMaxEdition()) &&
		(land <= Board.getNbLands(edition)) &&
		(Board.isBuildingLand(edition, land)) &&
		(buildType <= Board.getBuildType(edition));
	}

	function mint(
		address _to,
		uint16 _edition,
		uint8 _land,
		uint8 _buildType,
		uint32 _supply
	) public onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(isValidBuild(_edition, _land, _buildType), "BUILD does not exist");
		id_ = generateID(_edition, _land, _buildType);

		_mint(_to, id_, _supply, "");
	}

	function get(uint256 _id) public view returns (Building memory b_) {
		require(exists(_id), "This build does not exist");

		b_ = builds[_id];
	}

	function burn(
		address _account,
		uint256 _id,
		uint32 _amount
	) public {
		_burn(_account, _id, _amount);
	}

	function supportsInterface(bytes4 _interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
		return super.supportsInterface(_interfaceId);
	}

	function generateID(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType
	) internal returns (uint256 id_) {
		id_ = uint256(keccak256(abi.encode(_edition, _land, _buildType)));

		if (!exists(id_)) {
			buildIdByLandByEdition[_edition][_land].push(id_);
			builds[id_] = Building(_edition, _land, _buildType);
		}
	}
}
