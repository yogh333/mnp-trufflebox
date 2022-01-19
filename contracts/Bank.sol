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

/** @title Bank contract
 * @notice Is the contract handler
 * @author Jerome Caporossi, Stéphane Chaunard, Alexandre Gautier
 */
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

	/**
     * @notice Event emitted when a property is bought
	 * @param to address
	 * @param prop_id Prop id*/
	event PropertyBought(address indexed to, uint256 indexed prop_id);
	/**
     * @notice Event emitted when a pawn is bought
	 * @param to address
	 * @param pawn_id pawn ID*/
	event PawnBought(address indexed to, uint256 indexed pawn_id);
	/**
     * @notice Event emitted after a withdraw
	 * @param to address
	 * @param value amount*/
	event eWithdraw(address indexed to, uint256 value);
	/**
     * @notice Event emitted when a player is enrolled in the game
	 * @param _edition edition ID
	 * @param player address*/
	event PlayerEnrolled(uint16 _edition, address indexed player);
	/**
     * @notice Event emitted when player throw dices and random number is requested.
	 * @param player address
	 * @param _edition edition ID
	 * @param requestID random request ID*/
	event RollingDices(address player, uint16 _edition, bytes32 requestID);
	/**
     * @notice Event emitted when a player buy MONO
	 * @param player address
	 * @param amount amount*/
	event MonoBought(address indexed player, uint256 amount);
	/**
     * @notice Event emitted when a property rent is paid by player
	 * @param player address
	 * @param amount amount*/
	event PropertyRentPaid(address indexed player, uint256 amount);

	/**
     * @dev Constructor
	 * @param PawnAddress address
	 * @param BoardAddress address
	 * @param PropAddress address
	 * @param MonoAddress address
	 * @param LinkAddress address
	 * @param StakingAddress address
	 * @dev ADMIN_ROLE, BANKER_ROLE are given to deployer
	 * @dev #### requirements :<br />
	 * @dev - all parameters addresses must not be address(0)*/
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

	/**
     * @notice buy a pawn (mandatory to play)
	 * @dev #### requirements :<br />
	 * @dev - MONO transfer*/
	function buyPawn() external {
		require(Mono.transferFrom(msg.sender, address(this), 1 ether), "$MONO transfer failed");

		uint256 pawn_id = Pawn.mint(msg.sender);

		emit PawnBought(msg.sender, pawn_id);
	}

	/** locate pawn on game's board
	 * @notice #### requirements :<br />
	 * @notice - edition is valid
	 * @notice - player has a pawn
	 * @notice - pawn is registered at this edition
	 * @param _edition edition number
	 * @return p_ Board contract pawn information struct*/
	function locatePlayer(uint16 _edition) public view returns (BoardContract.PawnInfo memory p_) {
		require(_edition <= Board.getMaxEdition(), "unknown edition");
		require(Pawn.balanceOf(msg.sender) != 0, "player does not own a pawn");

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.isRegistered(_edition, pawnID), "player does not enroll");

		p_ = Board.getPawnInfo(_edition, pawnID);
	}

	/** To enroll a player to a board, required to play.
	 * @notice #### requirements :<br />
	 * @notice - contract has allowance to spend enroll fee
	 * @notice - player has a pawn
	 * @notice - pawn is registered at this edition
	 * @param _edition board edition*/
	function enrollPlayer(uint16 _edition) public {
		require(Pawn.balanceOf(msg.sender) != 0, "player does not own a pawn");
		require(Mono.allowance(msg.sender, address(this)) >= enroll_fee, "player has to approve Bank for 50 $MONO");

		uint256 pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0);

		require(Board.register(_edition, pawnID), "error when enrolling");

		emit PlayerEnrolled(_edition, msg.sender);
	}

	/** To throw the dices and request a random number.
	 * @notice #### requirements :<br />
	 * @notice - round is completed
	 * @notice - player has a pawn
	 * @notice - pawn is registered at this edition
	 * @notice - Board contract has enough LINK to pay ChainLink fee to request VRF
	 * @param _edition board edition*/
	function rollDices(uint16 _edition) external {
		BoardContract.PawnInfo memory p = locatePlayer(_edition);
		require(p.isRoundCompleted, "Uncompleted round");

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

	/** To buy Mono with the Token network.*/
	function buyMono() public payable {
		uint256 MonoBalance = Mono.balanceOf(address(this));
		uint256 MonoUsdLastPrice = uint256(Staking.getLastPrice(address(Mono)));
		address _address = Staking.NETWORK_TOKEN_VIRTUAL_ADDRESS();
		uint256 TokenNetworkUsdLastPrice = uint256(Staking.getLastPrice(_address));
		uint256 amountToBuy = (msg.value * TokenNetworkUsdLastPrice) / MonoUsdLastPrice;

		require(amountToBuy > 0, "You need to send some network token");
		require(amountToBuy <= MonoBalance, "Not enough tokens in the reserve");

		Mono.transfer(msg.sender, amountToBuy);

		emit MonoBought(msg.sender, amountToBuy);
	}

	/** buy PROP
	 * @notice #### requirements :<br />
	 * @notice - Round must be uncompleted
	 * @notice - MONO transfer ok
	 * @dev - PROP is valid
	 * @param _edition board edition*/
	function buyProp(uint16 _edition) public {
		BoardContract.PawnInfo memory p = locatePlayer(_edition);
		require(!p.isRoundCompleted, "Round completed");
		uint8 _rarity = retrievePropertyRarity(p.random);
		require(Prop.isValidProp(_edition, p.position, _rarity), "PROP does not exist");
		uint256 price = propPrices[_edition][p.position][_rarity];
		require(Mono.transferFrom(msg.sender, address(this), price), "$MONO transfer failed");
		uint256 prop_id = Prop.mint(msg.sender, _edition, p.position, _rarity);

		p.isPropertyBought = true;
		p.isRoundCompleted = true;

		uint256 _pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0); // todo player can have several pawns
		Board.setPawnInfo(_edition, _pawnID, p);

		emit PropertyBought(msg.sender, prop_id);
	}

	/** pay property rent
	 * @notice #### requirements :<br />
	 * @notice - Round must be uncompleted
	 * @notice - MONO transfer ok
	 * @dev - PROP is valid
	 * @param _edition board edition*/
	function payRent(uint16 _edition) public {
		BoardContract.PawnInfo memory p = locatePlayer(_edition);
		require(!p.isRoundCompleted, "Round completed");
		uint8 _rarity = retrievePropertyRarity(p.random);

		require(Prop.isValidProp(_edition, p.position, _rarity), "PROP does not exist");

		uint256 amount = retrievePropertyRent(_edition, p.position, _rarity);
		require(Mono.transferFrom(msg.sender, address(this), amount), "Tax payment failed");

		p.isRentPaid = true;
		p.isRoundCompleted = true;

		uint256 _pawnID = Pawn.tokenOfOwnerByIndex(msg.sender, 0); // todo player can have several pawns
		Board.setPawnInfo(_edition, _pawnID, p);

		emit PropertyRentPaid(msg.sender, amount);
	}

	/** @dev Retrieve property rent
	 * @param _edition edition ID
	 * @param _land land ID
	 * @param _rarity rarity
	 * @return amount*/
	function retrievePropertyRent(uint16 _edition, uint8 _land, uint8 _rarity) internal view returns(uint256){
		return propPrices[_edition][_land][_rarity] / 100 > 10**18 ? propPrices[_edition][_land][_rarity] : 10**18;
	}

	/** @dev Retrieve property rarity from randomness
	 * @dev use calculateRandomInteger() with type = 'rarity'
	 * @param randomness ChainLink VRF random number
	 * @return number*/
	function retrievePropertyRarity(uint256 randomness) internal pure returns(uint8){
		uint256 number = calculateRandomInteger("rarity", 1, 111, randomness);

		if (number <= 100) return 2;
		if (number <= 110) return 1;
		return 0;
	}

	/** @dev Calculate a new random integer in [min, max] from random ChainLink VRF.
	 * @param _type used to calculate new number
	 * @param min minimum integer
	 * @param max maximum integer
	 * @param randomness ChainLink VRF random number
	 * @return number*/
	function calculateRandomInteger(string memory _type, uint256 min, uint256 max, uint256 randomness) internal pure returns(uint256) {
		uint256 modulo = max - min + 1;
		uint256 number = uint256(keccak256(abi.encode(randomness, _type)));

		return number % modulo + min;
	}

	/** get a property price
	 * @notice #### requirements :<br />
	 * @notice - property mus be valid
	 * @param _edition edition ID
	 * @param _land land ID
	 * @param _rarity rarity
	 * @return price*/
	function getPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity
	) external view returns (uint256 price) {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		price = propPrices[_edition][_land][_rarity];
	}

	/** set a property price
	 * @notice #### requirements :<br />
	 * @notice - must have BANKER role
	 * @notice - property mus be valid
	 * @param _edition edition ID
	 * @param _land land ID
	 * @param _rarity rarity
	 * @param _price amount*/
	function setPriceOfProp(
		uint16 _edition,
		uint8 _land,
		uint8 _rarity,
		uint256 _price
	) public onlyRole(BANKER_ROLE) {
		require(Prop.isValidProp(_edition, _land, _rarity), "PROP does not exist");
		propPrices[_edition][_land][_rarity] = _price;
	}

	/** withdraw
	 * @notice #### requirements :<br />
	 * @notice - must have BANKER role
	 * @notice - MONO transfer
	 * @param _to address
	 * @param _value amount*/
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

	/** set properties prices, useful to add an edition from admin
	 * @param _editionId edition ID
	 * @param _maxLands max lands
	 * @param _maxLandRarities max land rarity
	 * @param _rarityMultiplier rarity multiplier
	 * @param _commonLandPrices common land rarity price*/
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

	/** Transfer property ERC721 and royalties to receiver. Useful for our Marketplace<br />
	 * @notice #### requirements :<br />
	 * @notice - only BANKER role
	 * @notice - buyer MONO balance must be greater than sell price
	 * @dev - This contract must be allowed contract for transfer
	 * @dev - MONO transfer sell price
	 * @param _from the seller
	 * @param _to the buyer
	 * @param _tokenId the Property token id
	 * @param _salePrice the sale price */
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
