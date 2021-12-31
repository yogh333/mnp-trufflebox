// Pawn.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract PawnContract is ERC721Enumerable, AccessControl {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	string private baseTokenURI;

	struct PawnStruct {
		uint8 subject; /* car, thimble, hat, ship, shoe, wheelbarrow, dog, cat */
		uint8 background; /* blanc, noir, bleu, rouge, vert, jaune, bleu clair, violet, arc-en-ciel */
		uint8 material; /* carton, bois, plastique, cuivre, plomb, étain, argent, palladium, platine, or */
		uint8 halo; /* aucun, bleu électrique, jaune solaire, pure blanc, vert plasma, psycho arc-en-ciel, fusion flou */
		uint8 power; /* aucun, monopole, anarchiste, politicien, avocat, juge, banquier, médias, startuper, star, CEO */
		uint8 level;
		uint8 xp;
	}

	mapping(uint256 => PawnStruct) private pawns;

	constructor(
		string memory _name,
		string memory _symbol,
		string memory _baseTokenURI
	) ERC721(_name, _symbol) {
		baseTokenURI = _baseTokenURI;

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);
	}

	function _baseURI() internal view override returns (string memory) {
		return baseTokenURI;
	}

	function tokenURI(uint256 _id) public view override returns (string memory) {
		string memory uri = super.tokenURI(_id);

		string memory ext = ".json";

		return string(abi.encodePacked(uri, ext));
	}

	function mint(address _to) external onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(balanceOf(_to) == 0, "player already owns a pawn");

		PawnStruct memory p;
		uint8 r = random(msg.sender);
		p.subject = r % 8;
		p.background = r % 10;
		p.material = r % 10;
		p.halo = r % 7;
		p.power = r % 11;
		p.level = 0;
		p.xp = 0;

		id_ = generateID(p);

		_safeMint(_to, id_);

		pawns[id_] = p;
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		override(ERC721Enumerable, AccessControl)
		returns (bool)
	{
		return super.supportsInterface(_interfaceId);
	}

	function get(uint256 _id) public view returns (PawnStruct memory p_) {
		require(_exists(_id), "This pawn does not exist");

		p_ = pawns[_id];
	}

	function generateID(PawnStruct memory _p) internal pure returns (uint256 id_) {
		return
			uint256(
				keccak256(abi.encodePacked(_p.subject, _p.background, _p.material, _p.halo, _p.power, _p.level, _p.xp))
			);
	}

	/// @dev pseudo-random function
	/// @return a random value in between [0, type(uint8).max]
	function random(address user) internal view returns (uint8) {
		return uint8(uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, user))) % type(uint8).max);
	}
}
