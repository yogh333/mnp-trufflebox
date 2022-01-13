// Board.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
//import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "./Stubs/ChainLinkVRFStub.sol";

/// @title Board
/// @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
/// @notice Implements game logic and board's features
contract BoardContract is AccessControl, VRFConsumerBase {
	/// @dev structure used to store pawn's attribute
	struct PawnInfo {
		uint256 random;
		uint8 position;
		bool isOnBoard;
	}

	/// @dev structure used to store pawn's attribute
	struct BoardInfo {
		uint8 nbOfLands;
		uint8 rarityLevel;
		mapping(uint8 => bool) isBuildingLand;
		uint8 buildType;
		mapping(uint256 => PawnInfo) pawns;
		uint16 nb_pawns_max;
		uint16 nb_pawns;
	}

	struct PlayInfo {
		uint256 pawnID;
		uint16 edition;
	}

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
	bytes32 internal keyHash;
	/// @dev number of board editions
	uint16 private editionMax;
	uint256 public fee;
	uint256 public randomResult;

	/// @dev store all boards by edition number
	mapping(uint16 => BoardInfo) private boards;

	mapping(bytes32 => PlayInfo) private playInfoByRequestId;

	/// @notice event emitted when a new board is created
	/// @param new_edition_nb new board edition number
	event eBoard(uint16 indexed new_edition_nb);

	/// @notice event emitted when a new pawn is registered on a board
	/// @param _edition board edition number
	/// @param _pawnID pawn's ID
	event ePawn(uint16 indexed _edition, uint256 indexed _pawnID);

	event RandomReady(bytes32 requestId);

	/// @notice constructor
	constructor(
		address _VRFCoordinator,
		address _LinkToken,
		bytes32 _keyHash,
		uint256 _Chainlinkfee
	) VRFConsumerBase(_VRFCoordinator, _LinkToken) {
		keyHash = _keyHash;
		fee = _Chainlinkfee;

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MANAGER_ROLE, msg.sender);
		_setRoleAdmin(MANAGER_ROLE, ADMIN_ROLE);

		editionMax = 0;

		BoardInfo storage b = boards[0];

		b.nbOfLands = 40;
		b.nb_pawns_max = 1000;
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
	 * @notice Requests randomness
	 */
	function requestRandomNumber() internal returns (bytes32 requestId) {
		////====================== ?   TODO: correction for the require
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
		requestId = requestRandomness(keyHash, fee);
	}

	/**
	 * @notice Callback function used by VRF Coordinator
	 * @param requestId the id of the request for the oracle
	 * @param randomness randomness must be requested from an oracle, which generates a number and a cryptographic proof
	 * @dev /!\ Maximum Gas for Callback : If your fulfillRandomness function uses more than 200k gas, the transaction will fail.
	 */
	function rawFulfillRandomness(bytes32 requestId, uint256 randomness) public override {
		PlayInfo storage p = playInfoByRequestId[requestId];

		boards[p.edition].pawns[p.pawnID].position += uint8(randomness % 11) + 2;
		boards[p.edition].pawns[p.pawnID].position %= boards[p.edition].nbOfLands;
		boards[p.edition].pawns[p.pawnID].random = randomness;

		emit RandomReady(requestId);
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
		BoardInfo storage b = boards[editionMax];
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
		require(boards[_edition].nb_pawns < boards[_edition].nb_pawns_max, "game is full");

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
	 */
	function play(uint16 _edition, uint256 _pawnID) external onlyRole(MANAGER_ROLE) returns (bytes32 requestId) {
		require(boards[_edition].pawns[_pawnID].isOnBoard == true, "Unregistered pawn");

		requestId = requestRandomNumber();

		PlayInfo storage p = playInfoByRequestId[requestId];

		p.edition = _edition;
		p.pawnID = _pawnID;
	}

	/**
	 * @notice get position of a Pawn on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return p Pawn information
	 */
	function getPawn(uint16 _edition, uint256 _pawnID) external view returns (PawnInfo memory p) {
		require(isRegistered(_edition, _pawnID), "pawn has not been regsitered");
		return boards[_edition].pawns[_pawnID];
	}
}
