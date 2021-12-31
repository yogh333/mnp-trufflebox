// Bank.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "./Pawn.sol";
import "./Board.sol";
import "./Mono.sol";
import "./Prop.sol";
import "./Build.sol";

contract BankContract is AccessControl, IERC721Receiver {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant BANKER_ROLE = keccak256("BANKER_ROLE");

	PawnContract private immutable Pawn;
	BoardContract private immutable Board;
	PropContract private immutable Prop;
	BuildContract private immutable Build;
	MonoContract private immutable Mono;

	/// @dev fee to be paid when player enrolls (in $MONO)
	uint256 public enroll_fee = 50 * 1 ether;

	/// @dev fee to be paid for each roll of dices (in $MONO)
	uint256 public dices_fee = 1 ether;

	/// @dev price of PROP by rarity by land by edition
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint256))) private propPrices;

	/// @dev price of BUILD by type by land by edition
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint256))) private buildPrices;

	event eBuyProp(address indexed to, uint256 indexed prop_id);
	event eBuyBuild(address indexed to, uint256 indexed build_id, uint32 nb);
	event eBuyPawn(address indexed to, uint256 indexed pawn_id);
	event eSellProp(address indexed seller, uint256 indexed prop_id, uint256 price);
	event eSellBuild(address indexed seller, uint256 indexed prop_id, uint256 price);
	event eWithdraw(address indexed to, uint256 value);

	event eEnrollPlayer(uint16 _edition, address indexed player);
	event eMovePawn(address player, uint8 dices);

	constructor(
		address PawnAddress,
		address BoardAddress,
		address PropAddress,
		address BuildAddress,
		address MonoAddress
	) {
		require(PawnAddress != address(0), "PAWN token smart contract address must be provided");
		require(BoardAddress != address(0), "BOARD smart contract address must be provided");
		require(PropAddress != address(0), "PROP token smart contract address must be provided");
		require(BuildAddress != address(0), "BUILD token smart contract address must be provided");
		require(MonoAddress != address(0), "MONO token smart contract address must be provided");

		Pawn = PawnContract(PawnAddress);
		Board = BoardContract(BoardAddress);
		Prop = PropContract(PropAddress);
		Build = BuildContract(BuildAddress);
		Mono = MonoContract(MonoAddress);

		// Set roles
		_setupRole(ADMIN_ROLE, msg.sender);
		_setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
		_setupRole(BANKER_ROLE, msg.sender);
		_setRoleAdmin(BANKER_ROLE, ADMIN_ROLE);
	}

	/// @notice buy a pawn (mandatory to play)
	function buyPawn() external {
		require(Mono.transferFrom(msg.sender, address(this), 1 ether), "$MONO transfer failed");

		uint256 pawn_id = Pawn.mint(msg.sender);

		emit eBuyPawn(msg.sender, pawn_id);
	}

	/// @notice locate pawn on game's board
	/// @param _edition edition number
	/// @return position_ position on board
	function locatePlayer(uint16 _edition) external view returns (uint8 position_) {
		require(_edition <= Board.getMaxEdition(), "unknown edition");
		require(Pawn.balanceOf(msg.sender) == 1, "player does not own a pawn");

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.isRegistered(_edition, pawnID), "player does not enroll");

		position_ = Board.getPawn(_edition, pawnID);
	}

	function enrollPlayer(uint16 _edition) external {
		require(Pawn.balanceOf(msg.sender) == 1, "player does not own a pawn");
		require(
			Mono.allowance(msg.sender, address(this)) == enroll_fee,
			"player has to approbe Bank for 50 $MONO"
		);

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.register(_edition, pawnID), "error when enrolling");

		emit eEnrollPlayer(_edition, msg.sender);
	}

	function rollDices(uint16 _edition) external {
		require(Pawn.balanceOf(msg.sender) == 1, "player does not own a pawn");
		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);
		require(Board.isRegistered(_edition, pawnID), "player does not enroll");

		// Bank must be paid here (1 $MONO)
		Mono.transferFrom(msg.sender, address(this), dices_fee);

		// Bank must provide LINK to Board

		uint8 dices = Board.play(_edition, pawnID);

		emit eMovePawn(msg.sender, dices);
	}

	function buyProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) public {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		uint256 price = propPrices[_edition][_land][_rarity];

		require(Mono.transferFrom(msg.sender, address(this), price), "$MONO transfer failed");

		uint256 prop_id = Prop.mint(msg.sender, _edition, _land, _rarity);

		emit eBuyProp(msg.sender, prop_id);
	}

	function sellProp(uint256 _id) public {
		require(Prop.ownerOf(_id) == msg.sender, "cannot sell a non owned property");

		//(version, cell, rarity, serial) = Prop.get(_id);
		PropContract.Property memory prop = Prop.get(_id);

		/* Bank buys PROP at 30% of selling price */
		uint256 price = (propPrices[prop.edition][prop.land][prop.rarity] * 30) / 100;

		require(Mono.balanceOf(address(this)) >= price, "Bank does not own enough funds");

		Prop.safeTransferFrom(msg.sender, address(this), _id);

		Mono.transfer(msg.sender, price);

		emit eSellProp(msg.sender, _id, price);
	}

	function buyBuild(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType,
		uint32 _amount
	) public payable {
		require(Build.isValidBuild(_edition, _land, _buildType), "BUILD does not exist");
		uint256 price = buildPrices[_edition][_land][_buildType];

		require(Mono.transferFrom(msg.sender, address(this), _amount * price), "$MONO transfer failed");

		uint256 build_id = Build.mint(msg.sender, _edition, _land, _buildType, _amount);

		emit eBuyBuild(msg.sender, build_id, _amount);
	}

	function sellBuild(uint256 _id, uint32 _amount) public {
		BuildContract.Building memory b = Build.get(_id);

		/* Bank buys BUILD at 30% of selling price */
		uint256 price = (buildPrices[b.edition][b.land][b.buildType] * 30 * _amount) / 100;

		require(Mono.balanceOf(address(this)) >= price, "Bank does not own enough funds");

		Build.burn(msg.sender, _id, _amount);

		Mono.transfer(msg.sender, price);

		emit eSellBuild(msg.sender, _id, price);
	}

	function getPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) external view returns (uint256 price) {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		price = propPrices[_edition][_land][_rarity];
	}

	function getPriceOfBuild(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType
	) external view returns (uint256 price) {
		require(Build.isValidBuild(_edition, _land, _buildType), "BUILD does not exist");
		price = buildPrices[_edition][_land][_buildType];
	}

	function setPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity,
		uint256 _price
	) public onlyRole(BANKER_ROLE) {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		propPrices[_edition][_land][_rarity] = _price;
	}

	function setPriceOfBuild(
		uint16 _edition,
		uint8 _land,
		uint8 _buildType,
		uint256 _price
	) public onlyRole(BANKER_ROLE) {
		require(Build.isValidBuild(_edition, _land, _buildType), "BUILD does not exist");
		buildPrices[_edition][_land][_buildType] = _price;
	}

	function withdraw(address _to, uint256 _value) external onlyRole(BANKER_ROLE) {
		require(Mono.transfer(_to, _value), "withdraw failure");

		emit eWithdraw(_to, _value);
	}

	function onERC721Received(
		address operator,
		address from,
		uint256 tokenId,
		bytes calldata data
	) external pure override returns (bytes4) {
		return this.onERC721Received.selector;
	}

	function setPrices(
		uint16 _editionId,
		uint8 _maxLands,
		uint8 _maxLandRarities,
		uint16 _rarityMultiplier,
		uint16 _buildingMultiplier,
		uint256[] calldata _commonLandPrices,
		uint256[] calldata _buildPrices
	) external onlyRole(ADMIN_ROLE) {
		for (uint8 landId = 0; landId < _maxLands; landId++) {
			if (_commonLandPrices[landId] == 0) {
				continue;
			}

			for (uint8 rarity = 0; rarity < _maxLandRarities; rarity++) {
				propPrices[_editionId][landId][rarity] =
					_commonLandPrices[landId] *
					_rarityMultiplier**(_maxLandRarities - rarity - 1) *
					(1 ether);
			}

			if (_buildPrices[landId] == 0) {
				continue;
			}

			buildPrices[_editionId][landId][0] = _buildPrices[landId] * (1 ether);
			buildPrices[_editionId][landId][1] = _buildPrices[landId] * _buildingMultiplier * (1 ether);
		}
	}

	/**
	 * @notice Transfer property ERC721 and royalties to receiver. Useful for our Marketplace
	 * @dev
	 * @param _from the seller
	 * @param _to the buyer
	 * @param _tokenId the Property token id
	 * @param _salePrice the sale price
	 */
	function propertyTransfer(
		address _from,
		address _to,
		uint256 _tokenId,
		uint256 _salePrice
	) external onlyRole(BANKER_ROLE) {
		require (Prop.isApprovedForAll(_from, address(this)), "Contract is not allowed");
		address receiver;
		uint256 royaltyAmount;
		(receiver, royaltyAmount) = Prop.royaltyInfo(_tokenId, _salePrice);

		// Ajout du prix de la transaction en gas => oracle ? ou estimation large ?
		require(Mono.balanceOf(_to) > _salePrice, "Not sufficient token balance");

		require(Mono.transferFrom(_to, _from, _salePrice));

		if (receiver != address(0) && royaltyAmount > 0) {
			if (receiver != Prop.ownerOf(_tokenId)) { // royalties receiver pay nothing
				Mono.transferFrom(_from, receiver, royaltyAmount); // pay royalties
			}
		}

		Prop.safeTransferFrom(_from, _to, _tokenId);
	}
}
