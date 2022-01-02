// Board.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

/// @title Board
/// @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
/// @notice Implements game logic and board's features
contract BoardContract is AccessControl, VRFConsumerBase {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

	/// @notice event emitted when a new board is created
	/// @param new_edition_nb new board edition number
	event eBoard(uint16 indexed new_edition_nb);

	/// @notice event emitted when a new pawn is registered on a board
	/// @param _edition board edition number
	/// @param _pawnID pawn's ID
	event ePawn(uint16 indexed _edition, uint256 indexed _pawnID);

	/// @dev structure used to store pawn's attribute
	struct PawnStruct {
		bool isOnBoard;
		uint8 position;
	}

	/// @dev structure used to store pawn's attribute
	struct BoardStruct {
		uint8 nbOfLands;
		uint8 rarityLevel;
		mapping(uint8 => bool) isBuildingLand;
		uint8 buildType;
		mapping(uint256 => PawnStruct) pawns;
		uint16 nb_pawns_max;
		uint16 nb_pawns;
	}

	/// @dev number of board editions
	uint16 private editionMax;

	/// @dev store all boards by edition number
	mapping(uint16 => BoardStruct) private boards;

	bytes32 internal keyHash;
	uint256 internal fee;
	uint256 public randomResult;

	/// @notice constructor
	constructor()
		VRFConsumerBase(
			0x8C7382F9D8f56b33781fE506E897a4F1e2d17255, // VRF Coordinator
			0x326C977E6efc84E512bB9C30f76E30c160eD06FB // LINK Token
		)
	{
		keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4;
		fee = 0.0001 * 10**18; // 0.1 LINK (Varies by network)

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MANAGER_ROLE, msg.sender);
		_setRoleAdmin(MANAGER_ROLE, ADMIN_ROLE);

		editionMax = 0;

		BoardStruct storage b = boards[0];
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


	/**
	 * @dev pseudo-random function to simulate the roll of dice in the game
	 * @return a random value in between [0, type(uint16).max]
	 */

	function getRandomKeccak256() public view returns (uint16) {

		return
			uint16(((uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender))) %
			type(uint16).max) % 6) + 1);

	}

	/**
	 * @notice Requests randomness
	 * @return requestId the id of the request for the oracle
	 */
	function getRandomNumber() public returns (bytes32 requestId) {
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
		return requestRandomness(keyHash, fee);
	}

	/**
	 * @notice Callback function used by VRF Coordinator
	 * @param requestId the id of the request for the oracle
	 * @param randomness randomness must be requested from an oracle, which generates a number and a cryptographic proof
	 */
	function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
		randomResult = (randomness % 6) + 1;

	}

	/**
	 * @notice check if a land can be built (PROP and BUILD tokens available)
	 * @param edition board edition
	 * @param land cell number
	 * @return true or false
	 */
	function isBuildingLand(uint16 edition, uint8 land) external view returns (bool) {
		return boards[edition].isBuildingLand[land];
	}

	/**
	 * @notice get the number of board editions
	 * @return number of board editions
	 */
	function getMaxEdition() external view returns (uint16) {
		return editionMax;
	}

	/**
	 * @notice get the number of lands for a board edition
	 * @param edition board edition
	 * @return number of lands
	 */
	function getNbLands(uint16 edition) external view returns (uint8) {
		return boards[edition].nbOfLands;
	}

	/**
	 * @notice get the number of rarity level for a board edition
	 * @param edition board edition
	 * @return number of rarity levels
	 */
	function getRarityLevel(uint16 edition) external view returns (uint8) {
		return boards[edition].rarityLevel;
	}

	/**
	 * @notice get the number of build types for a board edition
	 * @param edition board edition
	 * @return number of build types
	 */
	function getBuildType(uint16 edition) external view returns (uint8) {
		return boards[edition].buildType;
	}

	/**
	 * @notice create a new board
	 * @param _nbOfLands number of lands
	 * @param _rarityLevel number of rarity levels
	 * @param _buildingLands array of index of lands which can be built
	 * @param _buildType number of built types
	 * @param _maxPawns max number of pawns allowed
	 */
	function newBoard(
		uint8 _nbOfLands,
		uint8 _rarityLevel,
		uint8[] calldata _buildingLands,
		uint8 _buildType,
		uint16 _maxPawns
	) public onlyRole(MANAGER_ROLE) {
		editionMax += 1;
		BoardStruct storage b = boards[editionMax];
		b.nbOfLands = _nbOfLands;
		b.rarityLevel = _rarityLevel;
		for (uint8 i = 0; i < _buildingLands.length; i++) {
			require(_buildingLands[i] < b.nbOfLands, "land index out of range");
			b.isBuildingLand[_buildingLands[i]] = true;
		}

		b.buildType = _buildType;
		b.nb_pawns_max = _maxPawns;

		emit eBoard(editionMax);
	}

	/**
	 * @notice register a pawn on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 */
	function register(uint16 _edition, uint256 _pawnID) external onlyRole(MANAGER_ROLE) returns (bool isOnBoarded) {
		require(_edition <= editionMax, "Unknown edition");
		require(boards[_edition].pawns[_pawnID].isOnBoard == false, "pawn already registered");
		require(boards[_edition].nb_pawns + 1 < boards[_edition].nb_pawns_max, "game is full");

		boards[_edition].pawns[_pawnID].isOnBoard = true;
		boards[_edition].nb_pawns += 1;

		emit ePawn(_edition, _pawnID);

		return true;
	}

	/**
	 * @notice check if a pawn is registered
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return true or false
	 */
	function isRegistered(uint16 _edition, uint256 _pawnID) public view returns (bool) {
		return boards[_edition].pawns[_pawnID].isOnBoard;
	}

	/**
	 * @notice play with a pawn
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return dices_score_ score of dices roll
	 */
	function play(uint16 _edition, uint256 _pawnID) external onlyRole(MANAGER_ROLE) returns (uint8 dices_score_) {
		require(boards[_edition].pawns[_pawnID].isOnBoard == true, "Unregistered pawn");

		// roll dices (randomly)
		dices_score_ = 4;

		// update player's position (modulo boards[edition].nbOfLands)
		boards[_edition].pawns[_pawnID].position += dices_score_ % boards[_edition].nbOfLands;
	}

	/**
	 * @notice get position of a Pawn on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return index of land
	 */
	function getPawn(uint16 _edition, uint256 _pawnID) external view returns (uint8) {
		require(isRegistered(_edition, _pawnID), "pawn has not been regsitered");
		return boards[_edition].pawns[_pawnID].position;
	}
}
