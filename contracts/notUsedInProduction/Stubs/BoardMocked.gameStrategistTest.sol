// Board.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

/// @dev for tests only
contract BoardGameStrategistTest {
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

	/// @dev number of board editions
	uint16 private editionMax;

	uint256 public pawnID;

	/// @dev store all boards by edition number
	mapping(uint16 => BoardInfo) public boards;

	constructor() {
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

		// Pawn initialization
		pawnID = uint256(0xd2ae2067bef5ced912dc3639bf77575813758210bc98a7f3fb3f9f29d852d39f);
		b.pawns[pawnID].isOnBoard = true;
		b.pawns[pawnID].isRoundCompleted = true;
	}

	/** @dev Game strategist
	 * @param _edition board edition
	 * @param _pawnID pawn ID*/
	function gameStrategist(uint16 _edition, uint256 _pawnID, uint8 _position) external {
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

		// Community chest card
		if (_position == 2 ||
			_position == 17 ||
			_position == 33
		) {
			boards[_edition].pawns[_pawnID].isCommunityCard = true;
			boards[_edition].pawns[_pawnID].isRoundCompleted = false;
			return;
		}

		// Go case
		// Nothing is implemented when a player pass over Go.
	}

	/** check if a land can be bought (PROP tokens available)
	 * @param edition board edition
	 * @param land cell number
	 * @return true or false*/
	function isPurchasable(uint16 edition, uint8 land) external view returns (bool) {
		return boards[edition].isPurchasable[land];
	}

	/** get Pawn information on a board
	 * @param _edition board edition
	 * @param _pawnID pawn ID
	 * @return p Pawn information*/
	function getPawnInfo(uint16 _edition, uint256 _pawnID) external view returns (PawnInfo memory p) {
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
	)  external {
		boards[_edition].pawns[_pawnID] = _pawnInfo;
	}

	///@dev for tests
	function setPosition(
		uint16 _edition,
		uint256 _pawnID,
		uint8 _position
	)  external {
		boards[_edition].pawns[_pawnID].position = _position;
		boards[_edition].pawns[_pawnID].isPropertyBought = false;
		boards[_edition].pawns[_pawnID].isRentPaid = false;
		boards[_edition].pawns[_pawnID].isInJail = false;
		boards[_edition].pawns[_pawnID].isChanceCard = false;
		boards[_edition].pawns[_pawnID].isCommunityCard = false;
		boards[_edition].pawns[_pawnID].isRoundCompleted = true;
	}
}
