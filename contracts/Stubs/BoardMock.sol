// BoardMock.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../Board.sol";

// @dev For tests only
contract BoardMock is BoardContract {

	constructor() BoardContract(
		address(0x514910771AF9Ca656af840dff83E8264EcF986CA),
		address(0x514910771AF9Ca656af840dff83E8264EcF986CA),
		0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4,
		0.0001 * 10 ** 18
	) {}

	function updatePawnInfo(uint16 _edition, uint256 _pawnID, uint8 _rarity, PawnInfo memory _pawnInfo) public {
		uint256 _random;
		/*uint8 rarity;
		for (uint i=0; rarity == _rarity; i++) {
			_random = uint256(keccak256(abi.encode(block.timestamp, i)));
			rarity = retrievePropertyRarity(_random);
		}*/

		/* script to retrieve random number from rarity
		for (let random = 1000; random < 5000; random++)
			await BoardInstance.retrievePropertyRarity(
		ethers.utils.parseEther(random.toString())
		).then((rarity) => {
		if (rarity.toNumber() === 0) {
		console.log("retrievePropertyRarity", random, rarity.toNumber());
		}
		});*/

		if (_rarity == 2) {
			_random = 1098;
		}

		if (_rarity == 1) {
			_random = 1097;
		}

		if (_rarity == 0) {
			_random = 1163;
		}

		_pawnInfo.random = _random;

		this.setPawnInfo(_edition, _pawnID, _pawnInfo);
	}

	// Strict copy of Bank functions turned to public type
	/*function retrievePropertyRarity(uint256 randomness) public pure returns(uint8){
		uint256 number = calculateRandomInteger("rarity", 1, 111, randomness);

		if (number <= 100) return 2;
		if (number <= 110) return 1;
		return 0;
	}

	function calculateRandomInteger(string memory _type, uint256 min, uint256 max, uint256 randomness) public pure returns(uint256) {
		uint256 modulo = max - min + 1;
		uint256 number = uint256(keccak256(abi.encode(randomness, _type)));

		return number % modulo + min;
	}*/
}
