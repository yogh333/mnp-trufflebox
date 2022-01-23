// Board.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

/**
 * @title Board contract
 * @notice Implements game logic and board's features
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
contract BoardContract is AccessControl, VRFConsumerBase {
	/// @dev structure used to store pawn's attribute
	struct PawnInfo {
		uint256 random;
		uint8 position;
		bool isOnBoard;
		bool isPropertyBought;
		bool isRentPaid;
		bool isRoundCompleted;
		bool isInJail;
		bool isChanceCard;
		bool isCommunityCard;
	}

	/// @dev structure used to store pawn's attribute
	struct BoardInfo {
		uint8 nbOfLands;
		uint8 rarityLevel;
		mapping(uint8 => bool) isPurchasable;
		mapping(uint256 => PawnInfo) pawns;
		uint16 nb_pawns_max;
		uint16 nb_pawns;
	}

	/// @dev structure used to store play attributes
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
	/// @dev store play information by requestID. Use for randomness
	mapping(bytes32 => PlayInfo) private playInfoByRequestId;

	/** Event emitted when a new board is created
	 * @param new_edition_nb new board edition number*/
	event BoardCreated(uint16 indexed new_edition_nb);
	/** Event emitted when a new pawn is registered on a board
	 * @param _edition board edition number
	 * @param _pawnID pawn's ID*/
	event ePawn(uint16 indexed _edition, uint256 indexed _pawnID);
	/**
     * @notice Event emitted when a random number is received by contract
	 * @param requestId request id
	 * @dev see fulfillRandomness()*/
	event RandomReady(bytes32 requestId);

	/**
     * @dev Constructor
	 * @param _VRFCoordinator ChainLink VRFCoordinator contract address
	 * @param _LinkToken LINK token address
	 * @param _keyHash ChainLink keyHash parameter for VRF
	 * @param _Chainlinkfee ChainLink fee for VRF*/
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

		// Paris edition (0)
		BoardInfo storage b = boards[0];
		b.nbOfLands = 40;
		b.nb_pawns_max = 1000;
		b.rarityLevel = 2;

		uint8[10] memory notPurchasableLands = [0, 2, 7, 10, 17, 20, 22, 30, 33, 36];
		for (uint8 landID; landID < b.nbOfLands; landID++) {
			b.isPurchasable[landID] = true;
			for (uint8 n; n < notPurchasableLands.length; n++) {
				if (landID == notPurchasableLands[n]) {
					b.isPurchasable[landID] = false;
					break;
				}
			}
		}
	}

	/** @dev Request a random number
	 * @return requestId the id of the request for the oracle*/
	function requestRandomNumber() internal returns (bytes32 requestId) {
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
		requestId = requestRandomness(keyHash, fee);
	}

	/**
	 * @param requestId the id of the request for the oracle
	 * @param randomness randomness must be requested from an oracle, which generates a number and a cryptographic proof
	 * @dev Callback function used by ChainLink VRF Coordinator
	 * @dev /!\ Maximum Gas for Callback : If your fulfillRandomness function uses more than 200k gas, the transaction will fail.*/
	function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
		PlayInfo storage p = playInfoByRequestId[requestId];

		boards[p.edition].pawns[p.pawnID].position += uint8(randomness % 11) + 2;
		boards[p.edition].pawns[p.pawnID].position %= boards[p.edition].nbOfLands;
		boards[p.edition].pawns[p.pawnID].random = randomness;

		boards[p.edition].pawns[p.pawnID].isPropertyBought = false;
		boards[p.edition].pawns[p.pawnID].isRentPaid = false;
		boards[p.edition].pawns[p.pawnID].isInJail = false;
		boards[p.edition].pawns[p.pawnID].isChanceCard = false;
		boards[p.edition].pawns[p.pawnID].isCommunityCard = false;
		boards[p.edition].pawns[p.pawnID].isRoundCompleted = true;

		gameStrategist(p.edition, p.pawnID, boards[p.edition].pawns[p.pawnID].position);

		emit RandomReady(requestId);
	}

	/** @dev Game strategist
	 * @param _edition board edition
	 * @param _pawnID pawn ID*/
	function gameStrategist(uint16 _edition, uint256 _pawnID, uint8 _position) internal {
		// Purchasable lands
		if (boards[_edition].isPurchasable[_position]) {
			boards[_edition].pawns[_pawnID].isRoundCompleted = false;

			return;
		}

		// Go to jail
		if (_position == 30) {
			boards[_edition].pawns[_pawnID].isInJail = true;
			boards[_edition].pawns[_pawnID].position = 10;
			return;
		}

		// Free park
		if (_position == 20) {
			return;
		}

		// Jail simple visit
		if (_position == 10) {
			return;
		}

		// Chance card
		if (_position == 7 ||
			_position == 22 ||
			_position == 36
		) {
			boards[_edition].pawns[_pawnID].isChanceCard = true;
			boards[_edition].pawns[_pawnID].isRoundCompleted = false;
			return;
		}

		// Community card
		boards[_edition].pawns[_pawnID].isCommunityCard = true;
		boards[_edition].pawns[_pawnID].isRoundCompleted = false;
	}

	/** check if a land can be bought (PROP tokens available)
	 * @param edition board edition
	 * @param land cell number
	 * @return true or false*/
	function isPurchasable(uint16 edition, uint8 land) external view returns (bool) {
		return boards[edition].isPurchasable[land];
	}

	/** get the number of board editions
	 * @return number of board editions*/
	function getMaxEdition() external view returns (uint16) {
		return editionMax;
	}

	/** get the number of lands for a board edition
	 * @param edition board edition
	 * @return number of lands*/
	function getNbLands(uint16 edition) external view returns (uint8) {
		return boards[edition].nbOfLands;
	}

	/** get the number of rarity level for a board edition
	 * @param edition board edition
	 * @return number of rarity levels*/
	function getRarityLevel(uint16 edition) external view returns (uint8) {
		return boards[edition].rarityLevel;
	}

	/** create a new board
	 * @param _nbOfLands number of lands
	 * @param _rarityLevel number of rarity levels
	 * @param _maxPawns max number of pawns allowed*/
	function newBoard(
		uint8 _nbOfLands,
		uint8 _rarityLevel,
		uint8[] calldata _purchasableLands,
		uint16 _maxPawns
	) public onlyRole(MANAGER_ROLE) {
		editionMax += 1;
		BoardInfo storage b = boards[editionMax];
		b.nbOfLands = _nbOfLands;
		b.rarityLevel = _rarityLevel;
		for (uint8 index = 0; index < _purchasableLands.length; index++) {
			require(_purchasableLands[index] < b.nbOfLands, "land index out of range");
			b.isPurchasable[_purchasableLands[index]] = true;
		}

		b.nb_pawns_max = _maxPawns;

		emit BoardCreated(editionMax);
	}

	/** register a pawn on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID*/
	function register(uint16 _edition, uint256 _pawnID) external onlyRole(MANAGER_ROLE) returns (bool isOnBoarded) {
		require(_edition <= editionMax, "Unknown edition");
		require(boards[_edition].pawns[_pawnID].isOnBoard == false, "pawn already registered");
		require(boards[_edition].nb_pawns < boards[_edition].nb_pawns_max, "game is full");

		boards[_edition].pawns[_pawnID].isOnBoard = true;
		boards[_edition].pawns[_pawnID].isRoundCompleted = true; // require to throw dices at the beginning
		boards[_edition].nb_pawns += 1;

		emit ePawn(_edition, _pawnID);

		return true;
	}

	/** check if a pawn is registered
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return true or false*/
	function isRegistered(uint16 _edition, uint256 _pawnID) public view returns (bool) {
		return boards[_edition].pawns[_pawnID].isOnBoard;
	}

	/** play with a pawn
	 * @param _edition board edition
	 * @param _pawnID pawn ID*/
	function play(uint16 _edition, uint256 _pawnID) external onlyRole(MANAGER_ROLE) returns (bytes32 requestId) {
		require(boards[_edition].pawns[_pawnID].isOnBoard, "Unregistered pawn");
		require(boards[_edition].pawns[_pawnID].isRoundCompleted, "Round not completed");

		requestId = requestRandomNumber();

		PlayInfo storage p = playInfoByRequestId[requestId];

		p.edition = _edition;
		p.pawnID = _pawnID;
	}

	/** get Pawn information on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return p Pawn information*/
	function getPawnInfo(uint16 _edition, uint256 _pawnID) external view returns (PawnInfo memory p) {
		require(isRegistered(_edition, _pawnID), "pawn has not been regsitered");
		return boards[_edition].pawns[_pawnID];
	}

	/** set Pawn information on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @param _pawnInfo pawn information*/
	function setPawnInfo(
		uint16 _edition,
		uint256 _pawnID,
		PawnInfo memory _pawnInfo
	)  external onlyRole(MANAGER_ROLE)  {
		boards[_edition].pawns[_pawnID] = _pawnInfo;
	}
}
