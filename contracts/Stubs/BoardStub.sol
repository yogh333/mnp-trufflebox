// BoardStub.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PawnStub.sol";

// @dev For tests only
contract BoardStub is AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

	event eNewBoard(uint16 indexed new_edition_nb);

	struct Player {
		uint8 position;
		uint8 dices;
		uint256 pawnID;
	}

	struct Board {
		uint8 nbOfLands;
		uint8 rarityLevel;
		mapping(uint8 => bool) isBuildingLand;
		uint8 buildType;
		mapping(address => Player) players;
		uint16 nb_players_max;
		uint16 nb_players;
	}

	uint16 private editionMax;

	mapping(uint16 => Board) private boards;

	PawnStub immutable pawn;

	constructor(address pawn_address) {
		require(pawn_address != address(0));

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);

		editionMax = 0;
		pawn = PawnStub(pawn_address);

		Board storage b = boards[0];
		b.nbOfLands = 40;
		b.rarityLevel = 2;
		b.isBuildingLand[1] = true;
		b.isBuildingLand[3] = true;
		b.isBuildingLand[5] = true;
		b.isBuildingLand[6] = true;
		b.isBuildingLand[8] = true;
		b.isBuildingLand[9] = true;
		b.isBuildingLand[11] = true;
		b.isBuildingLand[13] = true;
		b.isBuildingLand[14] = true;
		b.isBuildingLand[15] = true;
		b.isBuildingLand[16] = true;
		b.isBuildingLand[18] = true;
		b.isBuildingLand[19] = true;
		b.isBuildingLand[21] = true;
		b.isBuildingLand[23] = true;
		b.isBuildingLand[24] = true;
		b.isBuildingLand[25] = true;
		b.isBuildingLand[26] = true;
		b.isBuildingLand[27] = true;
		b.isBuildingLand[29] = true;
		b.isBuildingLand[31] = true;
		b.isBuildingLand[32] = true;
		b.isBuildingLand[34] = true;
		b.isBuildingLand[35] = true;
		b.isBuildingLand[37] = true;
		b.isBuildingLand[39] = true;

		b.buildType = 1;
	}

	function isBuildingLand(uint16 edition, uint8 land) external view returns (bool) {
		return boards[edition].isBuildingLand[land];
	}

	function getMaxEdition() external view returns (uint16) {
		return editionMax;
	}

	function getNbLands(uint16 edition) external view returns (uint8) {
		return boards[edition].nbOfLands;
	}

	function getRarityLevel(uint16 edition) external view returns (uint8) {
		return boards[edition].rarityLevel;
	}

	function getBuildType(uint16 edition) external view returns (uint8) {
		return boards[edition].buildType;
	}

	function newBoard(
		uint8 _nbOfLands,
		uint8 _rarityLevel,
		uint8[] calldata _buildingLands,
		uint8 _buildType
	) public onlyRole(ADMIN_ROLE) {
		editionMax += 1;
		Board storage b = boards[editionMax];
		b.nbOfLands = _nbOfLands;
		b.rarityLevel = _rarityLevel;
		for (uint8 i = 0; i < _buildingLands.length; i++) {
			require(_buildingLands[i] < b.nbOfLands, "land index out of range");
			b.isBuildingLand[_buildingLands[i]] = true;
		}

		b.buildType = _buildType;

		emit eNewBoard(editionMax);
	}

	function register(
		uint16 _edition,
		address _player,
		uint256 _pawnID
	) external onlyRole(ADMIN_ROLE) {
		require(_edition <= editionMax, "Unknown edition");
		require(boards[_edition].players[_player].pawnID == 0, "player already registered");
		require(pawn.ownerOf(_pawnID) == _player, "player shall own a pawn");
		require(boards[_edition].nb_players + 1 < boards[_edition].nb_players_max, "game is full");

		boards[_edition].players[_player].pawnID = _pawnID;
		boards[_edition].nb_players += 1;

		// emit event new player
		//emit ePlayer(_player, _edition);
	}

	function play(uint16 _edition) external {
		require(boards[_edition].players[msg.sender].pawnID != 0, "Unregistered player");

		// roll dices (randomly)
		boards[_edition].players[msg.sender].dices = 4;

		// update player's position (modulo boards[edition].nbOfLands)
		boards[_edition].players[msg.sender].position += 4 % boards[_edition].nbOfLands;

		// emit event with player's new position
		//emit ePosition(msg.sender, _edition, board[edition].players[msg.sender].position);
	}
}
