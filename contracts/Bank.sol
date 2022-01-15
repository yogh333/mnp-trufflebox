// Bank.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Pawn.sol";
import "./Board.sol";
import "./Mono.sol";
import "./Prop.sol";
import "./Staking.sol";

contract BankContract is AccessControl, IERC721Receiver {
	bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
	bytes32 public constant BANKER_ROLE = keccak256("BANKER_ROLE");

	PawnContract private immutable Pawn;
	BoardContract private immutable Board;
	PropContract private immutable Prop;
	MonoContract private immutable Mono;
	IERC20 private immutable Link;
	StakingContract private immutable Staking;

	/// @dev fee to be paid when player enrolls (in $MONO)
	uint256 public enroll_fee = 50 * 1 ether;

	/// @dev price of PROP by rarity by land by edition
	mapping(uint16 => mapping(uint8 => mapping(uint8 => uint256))) private propPrices;

	event PropertyBought(address indexed to, uint256 indexed prop_id);
	event PawnBought(address indexed to, uint256 indexed pawn_id);
	event eWithdraw(address indexed to, uint256 value);

	event PlayerEnrolled(uint16 _edition, address indexed player);
	event RollingDices(address player, uint16 _edition, bytes32 requestID);
	event DicesRollsPrepaid(address indexed player, uint8 quantity);
	event MonoBought(address indexed player, uint256 amount);
	event PropertyRentPayed(address indexed player, uint256 amount);

	constructor(
		address PawnAddress,
		address BoardAddress,
		address PropAddress,
		address MonoAddress,
		address LinkAddress,
		address StakingAddress
	) {
		require(PawnAddress != address(0), "PAWN token smart contract address must be provided");
		require(BoardAddress != address(0), "BOARD smart contract address must be provided");
		require(PropAddress != address(0), "PROP token smart contract address must be provided");
		require(MonoAddress != address(0), "MONO token smart contract address must be provided");
		require(LinkAddress != address(0), "LINK token smart contract address must be provided");
		require(StakingAddress != address(0), "LINK token smart contract address must be provided");

		Pawn = PawnContract(PawnAddress);
		Board = BoardContract(BoardAddress);
		Prop = PropContract(PropAddress);
		Mono = MonoContract(MonoAddress);
		Link = IERC20(LinkAddress);
		Staking = StakingContract(StakingAddress);

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

		emit PawnBought(msg.sender, pawn_id);
	}

	/// @notice locate pawn on game's board
	/// @param _edition edition number
	/// @return p_ Pawn information
	function locatePlayer(uint16 _edition) public view returns (BoardContract.PawnInfo memory p_) {
		require(_edition <= Board.getMaxEdition(), "unknown edition");
		require(Pawn.balanceOf(msg.sender) == 1, "player does not own a pawn");

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.isRegistered(_edition, pawnID), "player does not enroll");

		p_ = Board.getPawn(_edition, pawnID);
	}

	/**
	 * @notice To enroll a player, this player must have a pawn and register it in Board contract and give allowance to this contract to spent 50 $MONO
	 * @param _edition board edition
	 */
	function enrollPlayer(uint16 _edition) public {
		require(Pawn.balanceOf(msg.sender) != 0, "player does not own a pawn");
		require(Mono.allowance(msg.sender, address(this)) >= enroll_fee, "player has to approve Bank for 50 $MONO");

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.register(_edition, pawnID), "error when enrolling");

		emit PlayerEnrolled(_edition, msg.sender);
	}

	function rollDices(uint16 _edition) external {
		require(Pawn.balanceOf(msg.sender) != 0, "player does not own a pawn");
		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);
		require(Board.isRegistered(_edition, pawnID), "player does not enroll");
		uint256 chainlinkFee = Board.fee();
		require(Link.balanceOf(address(Board)) > chainlinkFee, "not enough LINK in Board contract");

		// Bank must be paid here for a roll
		uint256 monoLastPrice = uint256(Staking.getLastPrice(address(Mono)));
		uint256 linkLastPrice = uint256(Staking.getLastPrice(address(Link)));
		Mono.transferFrom(msg.sender, address(this), (chainlinkFee * linkLastPrice) / monoLastPrice + 10**18);

		// Bank must provide LINK to Board
		bytes32 rollDicesID = Board.play(_edition, pawnID);

		emit RollingDices(msg.sender, _edition, rollDicesID);
	}

	/**
	 * @notice To buy Mono from Token network
	 */
	function buyMono() public payable {
		uint256 MonoBalance = Mono.balanceOf(address(this));
		uint256 MonoUsdLastPrice = uint256(Staking.getLastPrice(address(Mono)));
		//address _address = Staking.poolAddressBySymbol("MATIC");
		address _address = Staking.NETWORK_TOKEN_VIRTUAL_ADDRESS();
		uint256 TokenNetworkUsdLastPrice = uint256(Staking.getLastPrice(_address));
		uint256 amountToBuy = (msg.value * TokenNetworkUsdLastPrice) / MonoUsdLastPrice;
		require(amountToBuy > 0, "You need to send some network token");
		require(amountToBuy <= MonoBalance, "Not enough tokens in the reserve");
		Mono.transfer(msg.sender, amountToBuy);
		emit MonoBought(msg.sender, amountToBuy);
	}

	function buyProp(uint16 _edition) public {
		BoardContract.PawnInfo memory p = locatePlayer(_edition);
		uint8 _rarity = retrievePropertyRarity(p.random);
		require(Prop.isValidProp(_edition, p.position, _rarity), "PROP does not exist");
		uint256 price = propPrices[_edition][p.position][_rarity];
		require(Mono.transferFrom(msg.sender, address(this), price), "$MONO transfer failed");
		uint256 prop_id = Prop.mint(msg.sender, _edition, p.position, _rarity);



		emit PropertyBought(msg.sender, prop_id);
	}

	function payRent(uint16 _edition) public {
		BoardContract.PawnInfo memory p = locatePlayer(_edition);
		uint8 _rarity = retrievePropertyRarity(p.random);

		require(Prop.isValidProp(_edition, p.position, _rarity), "PROP does not exist");

		uint256 amount = retrievePropertyTax(_edition, p.position, _rarity);
		require(Mono.transferFrom(msg.sender, address(this), amount), "Tax payment failed");

		emit PropertyRentPayed(msg.sender, amount);
	}

	function retrievePropertyTax(uint16 _edition, uint8 _land, uint8 _rarity) internal view returns(uint256){
		return propPrices[_edition][_land][_rarity] / 100 > 10**18 ? propPrices[_edition][_land][_rarity] : 10**18;
	}

	function retrievePropertyRarity(uint256 randomness) internal pure returns(uint8){
		uint256 number = calculateRandomInteger("rarity", 1, 111, randomness);

		if (number <= 100) return 2;
		if (number <= 110) return 1;
		return 0;
	}

	function calculateRandomInteger(string memory _type, uint256 min, uint256 max, uint256 randomness) internal pure returns(uint256) {
		uint256 modulo = max - min + 1;
		uint256 number = uint256(keccak256(abi.encode(randomness, _type)));

		return number % modulo + min;
	}

	function getPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) external view returns (uint256 price) {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		price = propPrices[_edition][_land][_rarity];
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
		// silent warning
		operator;
		from;
		tokenId;
		data;
		return this.onERC721Received.selector;
	}

	function setPrices(
		uint16 _editionId,
		uint8 _maxLands,
		uint8 _maxLandRarities,
		uint16 _rarityMultiplier,
		uint256[] calldata _commonLandPrices
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
		require(Prop.isApprovedForAll(_from, address(this)), "Contract is not allowed");
		address receiver;
		uint256 royaltyAmount;
		(receiver, royaltyAmount) = Prop.royaltyInfo(_tokenId, _salePrice);

		// todo Ajout du prix de la transaction en gas => oracle ? ou estimation large ?
		require(Mono.balanceOf(_to) > _salePrice, "Not sufficient token balance");

		require(Mono.transferFrom(_to, _from, _salePrice));

		if (receiver != address(0) && royaltyAmount > 0) {
			if (receiver != Prop.ownerOf(_tokenId)) {
				// royalties receiver pay nothing
				Mono.transferFrom(_from, receiver, royaltyAmount); // pay royalties
			}
		}

		Prop.safeTransferFrom(_from, _to, _tokenId);
	}
}
