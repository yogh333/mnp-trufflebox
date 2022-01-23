// Pawn.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title Pawn contract
 * @notice Pawn ERC721 NTF, player must have one.
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
contract PawnContract is ERC721Enumerable, AccessControl {
	/// @dev structure used to store pawn's information
	struct PawnInfo {
		uint8 subject; /* car, thimble, hat, ship, shoe, wheelbarrow, dog, cat */
		uint8 background; /* blanc, noir, bleu, rouge, vert, jaune, bleu clair, violet, arc-en-ciel */
		uint8 material; /* carton, bois, plastique, cuivre, plomb, étain, argent, palladium, platine, or */
		uint8 halo; /* aucun, bleu électrique, jaune solaire, pure blanc, vert plasma, psycho arc-en-ciel, fusion flou */
		uint8 power; /* aucun, monopole, anarchiste, politicien, avocat, juge, banquier, médias, startuper, star, CEO */
		uint8 level;
		uint8 xp;
	}

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	string private baseTokenURI;

	mapping(uint256 => PawnInfo) private pawns;

	/**
     * @dev Constructor
	 * @param _name ChainLink VRFCoordinator contract address
	 * @param _symbol LINK token address
	 * @param _baseTokenURI ChainLink keyHash parameter for VRF
	 * @dev ADMIN_ROLE, MINTER_ROLE are given to deployer*/
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

	/** @dev get contract's baseURI
	 * @return string value*/
	function _baseURI() internal view override returns (string memory) {
		return baseTokenURI;
	}

	/** get token URI relative to a Pawn
	 * @param _id Pawn ID
	 * @return string value*/
	function tokenURI(uint256 _id) public view override returns (string memory) {
		string memory uri = super.tokenURI(_id);

		string memory ext = ".json";

		return string(abi.encodePacked(uri, ext));
	}

	/** Mint NFT token
	 * @notice #### requirements :<br />
	 * @notice 	- user must have MINTER role
	 * @notice 	- Property must be valid
	 * @param _to buyer address
	 * @return id_ Pawn ID*/
	function mint(address _to) external onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(balanceOf(_to) == 0, "player already owns a pawn");

		PawnInfo memory p;
		uint8 r = random(_to);
		p.subject = 1 + (r % 8);
		p.background = 1 + (r % 10);
		p.material = 1 + (r % 10);
		p.halo = 1 + (r % 7);
		p.power = 1 + (r % 11);
		p.level = 0;
		p.xp = 0;

		id_ = generateID(p);

		_safeMint(_to, id_);

		pawns[id_] = p;
	}

	/** is contract support interface
	 * @param _interfaceId interface ID
	 * @return bool*/
	function supportsInterface(bytes4 _interfaceId)
		public
		view
		override(ERC721Enumerable, AccessControl)
		returns (bool)
	{
		return super.supportsInterface(_interfaceId);
	}

	/** get information for a Pawn
	 * @param _id Pawn ID
	 * @return p_ Pawn information struct*/
	function get(uint256 _id) public view returns (PawnInfo memory p_) {
		require(_exists(_id), "This pawn does not exist");

		p_ = pawns[_id];
	}

	/** @dev generate an ID for a Pawn
	 * @param _p Pawn information struct
	 * @return id_ Pawn ID*/
	function generateID(PawnInfo memory _p) internal pure returns (uint256 id_) {
		return
			uint256(
				keccak256(abi.encodePacked(_p.subject, _p.background, _p.material, _p.halo, _p.power, _p.level, _p.xp))
			);
	}

	/** @dev pseudo-random function
	 * @param user address
	 * @return a random value in between [0, type(uint8).max]*/
	function random(address user) internal view returns (uint8) {
		return uint8(uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, user))) % type(uint8).max);
	}
}
