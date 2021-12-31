// Prop.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "./Board.sol";

/**
 * @notice
 * @dev
 * Royalties: Only some addresses are allowed to transfer these tokens (see isApprovedForAll() method and map isContractAllowed).
 * Token owner can't resell is token outside an authorized Marketplace or directly to another address.
 * support royalties implementation with method royaltyInfo() from ERC2981 (see interface declaration at supportsInterface function),
 * inherit from Ownable to support Opensea Marketplace
 * and add getRaribleV2Royalties method to support Rarible Marketplace.
 *
 *
 *
 */
contract PropContract is ERC721Enumerable, AccessControl, Ownable, IERC2981 {
	struct Property {
		// edition number
		uint16 edition;
		// id of the cell of board
		uint8 land;
		// rarity level (as a power of 10, i.e rarity = 1 means 10^1 = 10 versions)
		uint8 rarity;
		// serial number
		uint32 serial;
	}

	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

	BoardContract private immutable Board;

	mapping(uint256 => Property) private props;
	// Number of minted properties for each (edition, land, rarity) tuple
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint16))) numOfProps;

	// Bank contract allowance must be set in migration
	// and 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE OpenSea's ERC721 Proxy Address
	mapping(address => bool) public isOperatorAllowed;

	mapping(uint256 => uint96) private royaltiesValuesByTokenId;

	string private baseTokenURI;

	uint96 public defaultRoyaltyPercentageBasisPoints = 500; // 5%

	event RoyaltySet(uint256 tokenId, uint256 royaltyPercentageBasisPoints);

	constructor(
		address BoardAddress,
		string memory _name,
		string memory _symbol,
		string memory _baseTokenURI
	) ERC721(_name, _symbol) {
		baseTokenURI = _baseTokenURI;

		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(MINTER_ROLE, msg.sender);
		_setRoleAdmin(MINTER_ROLE, ADMIN_ROLE);

		Board = BoardContract(BoardAddress);
	}

	function isValidProp(
		uint16 edition,
		uint8 land,
		uint8 rarity
	) public view returns (bool) {
		return
			(edition <= Board.getMaxEdition()) &&
			(land <= Board.getNbLands(edition)) &&
			(Board.isBuildingLand(edition, land)) &&
			(rarity <= Board.getRarityLevel(edition))
		;
	}

	function _baseURI() internal view override returns (string memory) {
		return baseTokenURI;
	}

	function tokenURI(uint256 _id) public view override returns (string memory) {
		string memory uri = super.tokenURI(_id);

		string memory ext = ".json";

		return string(abi.encodePacked(uri, ext));
	}

	/** Mint NFT token and set royalties default value
	 * Requirements :
	 * 	- Property must be valid
	 * @param _to buyer address
	 * @param _edition board edition
	 * @param _land land id
	 * @param _rarity rarity
     */
	function mint(
		address _to,
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) external onlyRole(MINTER_ROLE) returns (uint256 id_) {
		require(isValidProp(_edition, _land, _rarity), "PROP cannot be minted");
		id_ = generateID(_edition, _land, _rarity);

		_safeMint(_to, id_);
		_setRoyalties(id_);
	}

	function get(uint256 _id) public view returns (Property memory p_) {
		require(exists(_id), "This property does not exist");

		p_ = props[_id];
	}

	function exists(uint256 _id) public view returns (bool) {
		return (
			(props[_id].land == 0) && (props[_id].edition == 0) && (props[_id].rarity == 0) && (props[_id].serial == 0)
				? false
				: true
		);
	}

	function getNbOfProps(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) public view returns (uint32 amount_) {
		require(isValidProp(_edition, _land, _rarity), "PROP does not exist");
		return numOfProps[_edition][_land][_rarity];
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		override(ERC721Enumerable, AccessControl, IERC165)
		returns (bool)
	{
		if (_interfaceId == _INTERFACE_ID_ERC2981) {
			return true;
		}

		return super.supportsInterface(_interfaceId);
	}

	function generateID(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) internal returns (uint256 id_) {
		uint32 serial = numOfProps[_edition][_land][_rarity];
		require(serial < 10**_rarity, "all properties already minted");

		numOfProps[_edition][_land][_rarity] += 1;

		id_ = uint256(keccak256(abi.encode(_edition, _land, _rarity, serial)));

		props[id_] = Property(_edition, _land, _rarity, serial);
	}

	/** Set default royalties percentage basis point. Can be only made by admin role.
	 * @param _percentageBasisPoints royalties percentage basis point i.e. 500 = 5%
     */
	function setDefaultRoyaltyPercentageBasisPoints(uint96 _percentageBasisPoints) public onlyRole(ADMIN_ROLE) {
		defaultRoyaltyPercentageBasisPoints = _percentageBasisPoints;
	}

	/** Set royalties for a NFT token id at percentage basis point. Can be only made by admin role.
	 * @param _tokenId NFT token id
     * @param _percentageBasisPoints royalties percentage basis point i.e. 500 = 5%
     */
	function setRoyalties(
		uint256 _tokenId,
		uint96 _percentageBasisPoints
	) public onlyRole(ADMIN_ROLE) {
		_setRoyalties(_tokenId, _percentageBasisPoints);
	}

	/** @dev Set royalties for a NFT token id at default percentage basis point.
	 * default value should be set with this.setDefaultRoyaltyPercentageBasisPoints
	 * @param _tokenId NFT token id
     * @dev See this._setRoyalties(uint256 _tokenId, uint96 _percentageBasisPoints)
     */
	function _setRoyalties(
		uint256 _tokenId
	) internal {
		_setRoyalties(_tokenId, defaultRoyaltyPercentageBasisPoints);
	}

	/** Set royalties for a NFT token id at a percentage basis point. Assuming that royalties receiver is contract's owner
	 * @param _tokenId NFT token id
	 * @param _percentageBasisPoints royalties percentage basis point i.e. 500 = 5%
     */
	function _setRoyalties(
		uint256 _tokenId,
		uint96 _percentageBasisPoints
	) internal {
		require(_percentageBasisPoints < 10000, "Royalty value should be < 10000");

		royaltiesValuesByTokenId[_tokenId] = _percentageBasisPoints;

		emit RoyaltySet(_tokenId, _percentageBasisPoints);
	}

	/** Return royalties information as describe at EIP-2981: NFT Royalty Standard
	 * return nul address and value if there is no royalty to pay.
	 * @param _tokenId NFT token id
	 * @param _salePrice sale price
	 * @return receiver royalty receiver address
	 * @return royaltyAmount royalty amount to pay to receiver
     * @dev Override isApprovedForAll to auto-approve confident operator contracts
     *      See {ERC721-isApprovedForAll}
     * 		See https://docs.opensea.io/docs/polygon-basic-integration#overriding-isapprovedforall-to-reduce-trading-friction
     * @inheritdoc IERC2981
     */
	function royaltyInfo(
		uint256 _tokenId,
		uint256 _salePrice
	) external view returns (
		address receiver,
		uint256 royaltyAmount
	) {
		uint96 royaltyValue = royaltiesValuesByTokenId[_tokenId];
		if (royaltyValue > 0) {
			return (this.owner(), (_salePrice * royaltyValue) / 10000);
		}

		return (address(0), 0);
	}

	function isApprovedForAll(
		address _owner,
		address _operator
	) public override view returns (bool) {
		if (isOperatorAllowed[_operator]) {
			return true;
		}

		return false;
	}

	/** Admin role can allowed un operator
	 * @param _address operator address
	 * @param value true / false
	 */
	function setIsOperatorAllowed(address _address, bool value) external onlyRole(ADMIN_ROLE) {
		isOperatorAllowed[_address] = value;
	}

	/**
     * @dev Override _isApprovedOrOwner to limit approval to confident operators only.
     *      See {IERC721-_isApprovedOrOwner}.
     */
	function _isApprovedOrOwner(address spender, uint256 tokenId) internal view override returns (bool) {
		require(_exists(tokenId), "ERC721: operator query for nonexistent token");
		address owner = ERC721.ownerOf(tokenId);

		return isApprovedForAll(owner, spender); // limit allowed operator as spender
	}
}
