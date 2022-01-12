require("dotenv").config();

ethers = require("ethers");

Paris = require("../client/src/data/Paris.json");

const Link = artifacts.require("Link");
const LinkForChainlinkVRF = artifacts.require("LinkForChainlinkVRF");

const EthUsdPriceFeed = artifacts.require("EthUsdPriceFeed");
const LinkUsdPriceFeed = artifacts.require("LinkUsdPriceFeed");
const MaticUsdPriceFeed = artifacts.require("MaticUsdPriceFeed");
const MonoUsdPriceFeed = artifacts.require("MonoUsdPriceFeed");

const Mono = artifacts.require("MonoContract");
const Pawn = artifacts.require("PawnContract");
const Board = artifacts.require("BoardContract");
const Build = artifacts.require("BuildContract");
const Prop = artifacts.require("PropContract");
const Bank = artifacts.require("BankContract");
const Staking = artifacts.require("StakingContract");

// Stubs
const BoardStub = artifacts.require("BoardStub");
const BuildStub = artifacts.require("BuildStub");
const ChainlinkPriceFeedStub = artifacts.require("ChainlinkPriceFeedStub");
const ERC20TokenStub = artifacts.require("ERC20TokenStub");
const MonoStub = artifacts.require("MonoStub");
const PawnStub = artifacts.require("PawnStub");

let LinkInstance;
let MonoInstance;
let PawnInstance;
let PropInstance;
let BuildInstance;
let BankInstance;
let StakingInstance;

let EthUsdPriceFeedInstance;
let LinkUsdPriceFeedInstance;
let MaticUsdPriceFeedInstance;
let MonoUsdPriceFeedInstance;

let MINTER_ROLE;
let MANAGER_ROLE;

let VRFCoordinator = "";
let LINK = "";
let KEYHASH = "";
let FEE;

module.exports = async function (deployer, network, accounts) {
  console.log(`deploying for '${network}' network ...`);

  // Deploy SMARTCONTRACTS
  switch (network) {
    case "test":
      // Deploy stubs
      //await deployer.deploy(BoardStub, PawnInstance.address);
      //await deployer.deploy(BuildStub);
      //await deployer.deploy(ChainlinkPriceFeedStub, 0.1 * 10 ** 8, 8);
      //await deployer.deploy(ERC20TokenStub, "ERC20 token", "ERC20");
      //await deployer.deploy(MonoStub);
      //await deployer.deploy(PawnStub);
      break;
    case "development":
      // Deploy MONO
      await deployer.deploy(Mono, ethers.utils.parseEther("300000"));
      MonoInstance = await Mono.deployed();

      // Deploy PAWN
      await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
      PawnInstance = await Pawn.deployed();

      // Deploy fake LINK to simulate Chainlink VRF
      await deployer.deploy(LinkForChainlinkVRF);
      LinkInstance = await LinkForChainlinkVRF.deployed();

      // Deploy BOARD
      await deployer.deploy(
        Board,
        LinkInstance.address, // VRF Coordinator is Link contract
        LinkInstance.address,
        "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
        0.0001 * 10 ** 18
      );
      BoardInstance = await Board.deployed();

      // Deploy PROP
      await deployer.deploy(
        Prop,
        BoardInstance.address,
        "MNW Properties",
        "MWP",
        "http://token-cdn-uri/"
      );
      PropInstance = await Prop.deployed();

      // Deploy BUILD
      await deployer.deploy(
        Build,
        BoardInstance.address,
        "http://token-cdn-uri/"
      );
      BuildInstance = await Build.deployed();

      // Price feeds
      await deployer.deploy(MonoUsdPriceFeed, 0.01 * 10 ** 8);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();

      await deployer.deploy(EthUsdPriceFeed, 3800 * 10 ** 8);
      EthUsdPriceFeedInstance = await EthUsdPriceFeed.deployed();

      //await deployer.deploy(MaticUsdPriceFeed, 2.48 * 10 ** 8);
      //MaticUsdPriceFeedInstance = await MaticUsdPriceFeed.deployed();

      await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
      LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

      // Deploy STAKING
      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100", // yield
        "ETH" // network token symbol
      );
      StakingInstance = await Staking.deployed();

      // Deploy BANK
      await deployer.deploy(
        Bank,
        PawnInstance.address,
        BoardInstance.address,
        PropInstance.address,
        BuildInstance.address,
        MonoInstance.address,
        LinkInstance.address,
        StakingInstance.address
      );
      BankInstance = await Bank.deployed();
      break;

    case "polygon_infura_testnet":
    case "kovan":
      // Deploy MONO
      await deployer.deploy(Mono, ethers.utils.parseEther("300000"));
      MonoInstance = await Mono.deployed();

      // Deploy PAWN
      await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
      PawnInstance = await Pawn.deployed();

      // Deploy LINK & BOARD
      if (network === "polygon_infura_testnet") {
        LINK = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
        VRFCoordinator = "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255";
        KEYHASH =
          "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4";
        FEE = web3.utils.toWei("0.0001", "ether");
      } else if (network === "kovan") {
        LINK = "0xa36085F69e2889c224210F603D836748e7dC0088";
        VRFCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
        KEYHASH =
          "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
        FEE = web3.utils.toWei("0.1", "ether");
      }

      await deployer.deploy(Board, VRFCoordinator, LINK, KEYHASH, FEE);
      BoardInstance = await Board.deployed();

      // Deploy PROP
      await deployer.deploy(
        Prop,
        BoardInstance.address,
        "MNW Properties",
        "MWP",
        "http://token-cdn-uri/"
      );
      PropInstance = await Prop.deployed();

      // Deploy BUILD
      await deployer.deploy(
        Build,
        BoardInstance.address,
        "http://token-cdn-uri/"
      );
      BuildInstance = await Build.deployed();

      // MONO/USD PRICE FEED
      await deployer.deploy(MonoUsdPriceFeed, 0.01 * 10 ** 8);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();

      // Deploy STAKING
      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100", // yield
        "ETH" // network token symbol
      );
      StakingInstance = await Staking.deployed();

      // Deploy BANK
      await deployer.deploy(
        Bank,
        PawnInstance.address,
        BoardInstance.address,
        PropInstance.address,
        BuildInstance.address,
        MonoInstance.address,
        LINK,
        StakingInstance.address
      );
      BankInstance = await Bank.deployed();
      break;

      break;
    default:
      console.log(`Can't deploy contract on this network : ${network}.`);
  }

  // CONFIGURATION

  switch (network) {
    case "development":
      console.log("Mint 1500 $LINK to BANK");
      await LinkInstance.faucet(
        BankInstance.address,
        ethers.utils.parseEther("1500")
      );
      console.log("Mint 1500 $LINK to BOARD");
      await LinkInstance.faucet(
        BoardInstance.address,
        ethers.utils.parseEther("1000")
      );

      /*console.log("LinkInstance.balanceOf(BankInstance.address)");
      let balance = await LinkInstance.balanceOf(BankInstance.address);
      console.log(ethers.utils.formatUnits(balance.toString(), "ether"));*/

      console.log("Mint 2000 $MONO to BANK");
      await MonoInstance.mint(
        StakingInstance.address,
        ethers.utils.parseEther("2000")
      );

      console.log("Mint 10000 $MONO");
      await MonoInstance.mint(
        BankInstance.address,
        ethers.utils.parseEther("10000")
      );

      // Add Tokens to stake
      /*StakingInstance.addPool(
        MaticInstance.address,
        MaticUsdPriceFeedInstance.address,
        110
      );*/

      const NETWORK_TOKEN_VIRTUAL_ADDRESS =
        await StakingInstance.NETWORK_TOKEN_VIRTUAL_ADDRESS();

      console.log("Add Pool ETH/MONO");
      await StakingInstance.addPool(
        NETWORK_TOKEN_VIRTUAL_ADDRESS,
        EthUsdPriceFeedInstance.address,
        110
      );

      console.log("Add Pool LINK/MONO");
      await StakingInstance.addPool(
        LinkInstance.address,
        LinkUsdPriceFeedInstance.address,
        120
      );

      console.log("Setup Roles");
      MINTER_ROLE = await PropInstance.MINTER_ROLE();
      await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MINTER_ROLE = await BuildInstance.MINTER_ROLE();
      await BuildInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MANAGER_ROLE = await BoardInstance.MANAGER_ROLE();
      await BoardInstance.grantRole(MANAGER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MINTER_ROLE = await PawnInstance.MINTER_ROLE();
      await PawnInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });

      break;

    case "polygon_infura_testnet":
    case "kovan":
      // Setup roles
      console.log("Setup Roles");
      MINTER_ROLE = await PropInstance.MINTER_ROLE();
      await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MINTER_ROLE = await BuildInstance.MINTER_ROLE();
      await BuildInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MANAGER_ROLE = await BoardInstance.MANAGER_ROLE();
      await BoardInstance.grantRole(MANAGER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      MINTER_ROLE = await PawnInstance.MINTER_ROLE();
      await PawnInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: accounts[0],
      });
      break;

    default:
      console.log(`Can't deploy contract on this network : ${network}.`);
  }

  // initialize Paris board prices
  console.log("Set $BUILD and $PROP prices");
  let commonLandPrices = [];
  let housePrices = [];
  Paris.lands.forEach((land, index) => {
    commonLandPrices[index] = 0;
    if (land.hasOwnProperty("commonPrice")) {
      commonLandPrices[index] = land.commonPrice;
    }

    housePrices[index] = 0;
    if (land.hasOwnProperty("housePrice")) {
      housePrices[index] = land.housePrice;
    }
  });

  await BankInstance.setPrices(
    Paris.id,
    Paris.maxLands,
    Paris.maxLandRarities,
    Paris.rarityMultiplier,
    Paris.buildingMultiplier,
    commonLandPrices,
    housePrices,
    { from: accounts[0] }
  );

  // Mint tokens for accounts
  //const amount = ethers.utils.parseEther("1000");
  //await MonoInstance.mint(accounts[1], amount);
  //await LinkInstance.faucet(accounts[1], amount);

  // Give allowance to contract to spend all $MONO
  //await MonoInstance.approve(BankInstance.address, amount, {
  //  from: accounts[1],
  //});

  // Allow Bank contract and OpenSea's ERC721 Proxy Address
  //await PropInstance.setIsOperatorAllowed(BankInstance.address, true);
  //await PropInstance.setIsOperatorAllowed(
  //  "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE",
  //  true
  //);

  // Mint pawn to players
  //await PawnInstance.mint(accounts[1]);
};
