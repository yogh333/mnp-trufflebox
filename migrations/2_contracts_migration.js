require("dotenv").config();

ethers = require("ethers");

Paris = require("../client/src/data/Paris.json");

const Link = artifacts.require("Link");
const LinkForChainlinkVRF = artifacts.require("LinkForChainlinkVRF");
const Mono = artifacts.require("MonoContract");

const EthUsdPriceFeed = artifacts.require("EthUsdPriceFeed");
const LinkUsdPriceFeed = artifacts.require("LinkUsdPriceFeed");
const MaticUsdPriceFeed = artifacts.require("MaticUsdPriceFeed");
const MonoUsdPriceFeed = artifacts.require("MonoUsdPriceFeed");

const Bank = artifacts.require("BankContract");
const Board = artifacts.require("BoardContract");
const Build = artifacts.require("BuildContract");
const Pawn = artifacts.require("PawnContract");
const Prop = artifacts.require("PropContract");
const Staking = artifacts.require("StakingContract");

// Stubs
const BoardStub = artifacts.require("BoardStub");
const BuildStub = artifacts.require("BuildStub");
const ChainlinkPriceFeedStub = artifacts.require("ChainlinkPriceFeedStub");
const ERC20TokenStub = artifacts.require("ERC20TokenStub");
const MonoStub = artifacts.require("MonoStub");
const PawnStub = artifacts.require("PawnStub");

let LinkInstance,
  MonoInstance,
  PawnInstance,
  PropInstance,
  BuildInstance,
  BankInstance,
  StakingInstance,
  EthUsdPriceFeedInstance,
  LinkUsdPriceFeedInstance,
  MaticUsdPriceFeedInstance,
  MonoUsdPriceFeedInstance;

module.exports = async function (deployer, network, accounts) {
  console.log(`deploying for '${network}' network ...`);

  if (network === "test") return; // todo Deploy contracts instances for test here

  // deploy ERC20 token contracts and price feeds and use these addresses in following deployment

  if (network !== "polygon_infura_testnet") {
    // Deploy MONO
    await deployer.deploy(Mono, ethers.utils.parseEther("300000"));
    MonoInstance = await Mono.deployed();

    // Deploy PAWN
    await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
    PawnInstance = await Pawn.deployed();
  }

  // Deploy BOARD
  switch (network) {
    case "test":
    case "develop":
    case "development":
      // others ERC20 tokens

      // Deploy this one if not using Chainlink VRF
      //await deployer.deploy(Link);
      //LinkInstance = await Link.deployed();

      // Deploy this Link contract to simulate Chainlink VRF
      await deployer.deploy(LinkForChainlinkVRF);
      LinkInstance = await LinkForChainlinkVRF.deployed();

      /*await deployer.deploy(Matic);
      MaticInstance = await Matic.deployed();*/

      // Price feeds
      await deployer.deploy(MonoUsdPriceFeed, 0.01 * 10 ** 8);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();
      /*let latestRoundData = await MonoUsdPriceFeedInstance.latestRoundData();
      console.log("MonoUsdPriceFeed");
      console.log(latestRoundData.answer.toNumber() / 10 ** 8);*/

      await deployer.deploy(EthUsdPriceFeed, 3800 * 10 ** 8);
      EthUsdPriceFeedInstance = await EthUsdPriceFeed.deployed();

      await deployer.deploy(MaticUsdPriceFeed, 2.48 * 10 ** 8);
      MaticUsdPriceFeedInstance = await MaticUsdPriceFeed.deployed();

      await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
      LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100", // yield
        "ETH" // network token symbol
      );
      StakingInstance = await Staking.deployed();

      await deployer.deploy(
        Board,
        LinkInstance.address, // VRF Coordinator is Link contract
        LinkInstance.address,
        "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
        0.0001 * 10 ** 18
      );

      break;

    case "polygon_infura_testnet":
      // Using an already deployed LINK
      // const linkAddress = "0x...."
      const LINK = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
      const VRFCoordinator = "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255";
      const KEYHASH =
        "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4";
      const FEE = web3.utils.toWei("0.0001", "ether");

      await deployer.deploy(Board, VRFCoordinator, LINK, KEYHASH, FEE);

      break;
    default:
      console.log(`Can't deploy contract on this network : ${network}.`);
  }
  const BoardInstance = await Board.deployed();

  if (network !== "polygon_infura_testnet") {
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
  }

  // Deploy BANK
  switch (network) {
    case "test":
    case "develop":
    case "development":
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

      await LinkInstance.faucet(
        BankInstance.address,
        ethers.utils.parseEther("1500")
      );

      await LinkInstance.faucet(
        BoardInstance.address,
        ethers.utils.parseEther("1000")
      );

      /*console.log("LinkInstance.balanceOf(BankInstance.address)");
      let balance = await LinkInstance.balanceOf(BankInstance.address);
      console.log(ethers.utils.formatUnits(balance.toString(), "ether"));*/

      await MonoInstance.mint(
        StakingInstance.address,
        ethers.utils.parseEther("2000")
      );

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

      await StakingInstance.addPool(
        NETWORK_TOKEN_VIRTUAL_ADDRESS,
        EthUsdPriceFeedInstance.address,
        110
      );

      await StakingInstance.addPool(
        LinkInstance.address,
        LinkUsdPriceFeedInstance.address,
        120
      );

      break;

    case "polygon_infura_testnet":
      // Price feeds are stored with Staking informations
      // MATIC / USD	8	0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
      // LINK / USD and MONO / USD are owned simulate feed contracts
      break;

    default:
      console.log(`Can't deploy contract on this network : ${network}.`);
  }

  // Deploy stubs
  if (network === "test") {
    await deployer.deploy(BoardStub, PawnInstance.address);
    await deployer.deploy(BuildStub);
    await deployer.deploy(ChainlinkPriceFeedStub, 0.1 * 10 ** 8, 8);
    await deployer.deploy(ERC20TokenStub, "ERC20 token", "ERC20");
    await deployer.deploy(MonoStub);
    await deployer.deploy(PawnStub);
  }

  if (network !== "polygon_infura_testnet") {
    // Setup roles
    const MINTER_ROLE = await PropInstance.MINTER_ROLE();
    await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
      from: accounts[0],
    });
    await BuildInstance.grantRole(MINTER_ROLE, BankInstance.address, {
      from: accounts[0],
    });
    const MANAGER_ROLE = await BoardInstance.MANAGER_ROLE();
    await BoardInstance.grantRole(MANAGER_ROLE, BankInstance.address, {
      from: accounts[0],
    });
    await PawnInstance.grantRole(MINTER_ROLE, BankInstance.address, {
      from: accounts[0],
    });

    // initialize Paris board prices
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
    const amount = ethers.utils.parseEther("1000");
    await MonoInstance.mint(accounts[1], amount);
    await LinkInstance.faucet(accounts[1], amount);

    // Give allowance to contract to spend all $MONO
    await MonoInstance.approve(BankInstance.address, amount, {
      from: accounts[1],
    });

    // Allow Bank contract and OpenSea's ERC721 Proxy Address
    await PropInstance.setIsOperatorAllowed(BankInstance.address, true);
    await PropInstance.setIsOperatorAllowed(
      "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE",
      true
    );

    // Mint pawn to players
    await PawnInstance.mint(accounts[1]);
  }
};
