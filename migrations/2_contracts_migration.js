require("dotenv").config();

ethers = require("ethers");

Paris = require("../client/src/data/Paris.json");

const Link = artifacts.require("Link");
const LinkForChainlinkVRF = artifacts.require("LinkForChainlinkVRF");
const CoordinatorVRF = artifacts.require("VRFCoordinatorContract");
const Mono = artifacts.require("MonoContract");
const MaticMono = artifacts.require("MaticMono");

const EthUsdPriceFeed = artifacts.require("EthUsdPriceFeed");
const LinkUsdPriceFeed = artifacts.require("LinkUsdPriceFeed");
const MaticMonoPriceFeed = artifacts.require("MaticMonoPriceFeed");
const MonoUsdPriceFeed = artifacts.require("MonoUsdPriceFeed");

const Bank = artifacts.require("BankContract");
const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");
const Prop = artifacts.require("PropContract");
const Staking = artifacts.require("StakingContract");

// Stubs
const ChainlinkPriceFeedStub = artifacts.require("ChainLinkPriceFeedStub");
const ERC20TokenStub = artifacts.require("ERC20TokenStub");
const MonoStub = artifacts.require("MonoStub");
const PawnStub = artifacts.require("PawnStubContract");

let LinkInstance,
  VRFCoordinatorInstance,
  MonoInstance,
  MaticMonoInstance,
  PawnInstance,
  PropInstance,
  BankInstance,
  StakingInstance,
  BoardInstance,
  EthUsdPriceFeedInstance,
  LinkUsdPriceFeedInstance,
  MaticMonoPriceFeedInstance,
  MonoUsdPriceFeedInstance,
  PawnStubInstance,
  LINK,
  VRFCoordinator,
  KEYHASH,
  FEE,
  ETH_USD,
  LINK_USD,
  MATIC_USD,
  MATIC_MONO,
  NETWORK_TOKEN_VIRTUAL_ADDRESS,
  MINTER_ROLE,
  MANAGER_ROLE,
  commonLandPrices,
  pawnID;

module.exports = async function (deployer, network, accounts) {
  console.log(`deploying for '${network}' network ...`);
  const admin = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const MonoUsdPrice = 0.001 * 10 ** 8;

  if (network === "test") {
    // Deploy stubs
    await deployer.deploy(ChainlinkPriceFeedStub, 0.1 * 10 ** 8, 8);
    await deployer.deploy(ERC20TokenStub, "ERC20 token", "ERC20");
    await deployer.deploy(MonoStub);
    await deployer.deploy(PawnStub);

    // return // uncomment if you want only stubs deployed for test network
  }

  switch (network) {
    case "test":
    case "develop":
    case "development":
      // deploy ERC20 token contracts and price feeds and use these addresses in following deployment
      // Deploy MONO
      await deployer.deploy(Mono, ethers.utils.parseEther("3000000"));
      MonoInstance = await Mono.deployed();

      // ***************
      // Deploy others ERC20 tokens
      // ***************

      // Deploy MATIC-MONO LP
      await deployer.deploy(MaticMono);
      MaticMonoInstance = await MaticMono.deployed();

      // Deploy this one if not using Chainlink VRF

      // Deploy the VRF Coordinator
      await deployer.deploy(CoordinatorVRF);
      VRFCoordinatorInstance = await CoordinatorVRF.deployed();
      // Deploy this Link contract to simulate Chainlink VRF
      await deployer.deploy(
        LinkForChainlinkVRF,
        VRFCoordinatorInstance.address
      );
      LinkInstance = await LinkForChainlinkVRF.deployed();

      // ***************
      // Deploy price feeds
      // ***************
      await deployer.deploy(MonoUsdPriceFeed, MonoUsdPrice);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();
      /*let latestRoundData = await MonoUsdPriceFeedInstance.latestRoundData();
      console.log("MonoUsdPriceFeed");
      console.log(latestRoundData.answer.toNumber() / 10 ** 8);*/

      await deployer.deploy(EthUsdPriceFeed, 3800 * 10 ** 8);
      EthUsdPriceFeedInstance = await EthUsdPriceFeed.deployed();

      await deployer.deploy(MaticMonoPriceFeed, 2480 * 10 ** 8);
      MaticMonoPriceFeedInstance = await MaticMonoPriceFeed.deployed();

      await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
      LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

      // ***************
      // Deploy Staking contract
      // ***************
      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100", // yield
        "ETH" // network token symbol
      );
      StakingInstance = await Staking.deployed();

      // ***************
      // Deploy Board contract
      // ***************
      await deployer.deploy(
        Board,
        VRFCoordinatorInstance.address,
        LinkInstance.address,
        "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
        0.0001 * 10 ** 18
      );

      BoardInstance = await Board.deployed();

      // ***************
      // Deploy Prop contract
      // ***************
      await deployer.deploy(
        Prop,
        BoardInstance.address,
        "MNW Properties",
        "MWP",
        "http://token-cdn-uri/"
      );
      PropInstance = await Prop.deployed();

      // ***************
      // Deploy Pawn contract
      // ***************
      await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
      PawnInstance = await Pawn.deployed();

      // ***************
      // Deploy Bank contract
      // ***************
      await deployer.deploy(
        Bank,
        PawnInstance.address,
        BoardInstance.address,
        PropInstance.address,
        MonoInstance.address,
        LinkInstance.address,
        StakingInstance.address
      );

      BankInstance = await Bank.deployed();

      // ***************
      // Transfer Links to Board and Bank contracts
      // ***************
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

      // ***************
      // Transfer Mono to Staking and Bank contracts and to ganache accounts
      // ***************
      await MonoInstance.mint(
        StakingInstance.address,
        ethers.utils.parseEther("200000")
      );
      await MonoInstance.mint(
        BankInstance.address,
        ethers.utils.parseEther("1000000")
      );

      for (let index = 0; index < 2; index++) {
        await MonoInstance.mint(
          accounts[index],
          ethers.utils.parseEther("100000")
        );
      }
      // Transfer Links to ganache account 1
      //await LinkInstance.faucet(player1, ethers.utils.parseEther("1000"));

      // ***************
      // Add ERC20 tokens to stake
      // ***************
      NETWORK_TOKEN_VIRTUAL_ADDRESS =
        await StakingInstance.NETWORK_TOKEN_VIRTUAL_ADDRESS();

      // Add network token
      await StakingInstance.addPool(
        NETWORK_TOKEN_VIRTUAL_ADDRESS,
        EthUsdPriceFeedInstance.address,
        110,
        "ETH",
        "Ether",
        false
      );

      await StakingInstance.addPool(
        LinkInstance.address,
        LinkUsdPriceFeedInstance.address,
        120,
        "LINK",
        "ChainLink Token",
        false
      );

      await StakingInstance.addPool(
        MaticMonoInstance.address,
        MaticMonoPriceFeedInstance.address,
        123,
        "MATIC-MONO",
        "LP Matic-Mono",
        true
      );

      // ***************
      // Setup roles
      // ***************
      MINTER_ROLE = await PropInstance.MINTER_ROLE();
      await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: admin,
      });
      await PawnInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: admin,
      });

      MANAGER_ROLE = await BoardInstance.MANAGER_ROLE();
      await BoardInstance.grantRole(MANAGER_ROLE, BankInstance.address, {
        from: admin,
      });

      // ***************
      // Setup Paris board prices
      // ***************
      commonLandPrices = [];
      Paris.lands.forEach((land, index) => {
        commonLandPrices[index] = 0;
        if (land.hasOwnProperty("commonPrice")) {
          commonLandPrices[index] = land.commonPrice;
        }
      });

      await BankInstance.setPrices(
        Paris.id,
        Paris.maxLands,
        Paris.maxLandRarities,
        Paris.rarityMultiplier,
        commonLandPrices,
        { from: admin }
      );

      // ***************
      // Give allowance for players to contract to spend all $MONO
      // ***************
      await MonoInstance.approve(
        BankInstance.address,
        ethers.utils.parseEther("100000"),
        {
          from: player1,
        }
      );

      // ***************
      // Allow Bank contract and OpenSea's ERC721 Proxy Address
      // ***************
      await PropInstance.setIsOperatorAllowed(BankInstance.address, true);
      await PropInstance.setIsOperatorAllowed(
        "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE",
        true
      );

      // ***************
      // Create pawn to players
      // ***************
      await PawnInstance.mint(player1);

      // ***************
      // Register pawns
      // ***************
      pawnID = await PawnInstance.tokenOfOwnerByIndex(player1, 0);
      await BoardInstance.register(Paris.id, pawnID, {
        from: admin,
      });

      break;

    case "mumbai":
    case "polygon_infura_testnet":
      console.warn(
        "/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\"
      );
      console.warn(`/!\\ Deployer account (${accounts[0]}) must have MATIC.`);
      console.warn(
        "/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\"
      );

      // deploy ERC20 token contracts and price feeds and use these addresses in following deployment
      // Deploy MONO
      await deployer.deploy(Mono, ethers.utils.parseEther("3000000"));
      MonoInstance = await Mono.deployed();

      // ***************
      // Deploy others ERC20 tokens
      //
      // Already deployed
      // LINK 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
      //
      // Mumbai Faucets
      // Testnet LINK and MATIC are available from the official Matic faucet and https://faucets.chain.link/mumbai.
      // ***************

      // ***************
      // Deploy price feeds
      //
      // Already deployed
      // MATIC/USD 	0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
      // LINK/USD not exists
      // ***************
      MATIC_USD = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada";

      await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
      LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

      await deployer.deploy(MaticMonoPriceFeed, 2480 * 10 ** 8);
      MaticMonoPriceFeedInstance = await MaticMonoPriceFeed.deployed();

      await deployer.deploy(MonoUsdPriceFeed, MonoUsdPrice);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();

      // ***************
      // Deploy Staking contract
      // ***************
      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100", // yield
        "MATIC" // network token symbol
      );
      StakingInstance = await Staking.deployed();

      // ***************
      // Deploy Board contract
      // ***************
      LINK = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
      VRFCoordinator = "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255";
      KEYHASH =
        "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4";
      FEE = web3.utils.toWei("0.0001", "ether");

      await deployer.deploy(Board, VRFCoordinator, LINK, KEYHASH, FEE);

      BoardInstance = await Board.deployed();

      // ***************
      // Deploy Prop contract
      // ***************
      await deployer.deploy(
        Prop,
        BoardInstance.address,
        "MNW Properties",
        "MWP",
        "http://token-cdn-uri/"
      );
      PropInstance = await Prop.deployed();

      // ***************
      // Deploy Pawn contract
      // ***************
      await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
      PawnInstance = await Pawn.deployed();

      // ***************
      // Deploy Bank contract
      // ***************
      await deployer.deploy(
        Bank,
        PawnInstance.address,
        BoardInstance.address,
        PropInstance.address,
        MonoInstance.address,
        LINK,
        StakingInstance.address
      );

      BankInstance = await Bank.deployed();

      // ***************
      // Transfer LINK to Board and Bank contracts
      //
      // Testnet LINK are available from https://faucets.chain.link/kovan
      // ***************

      // ***************
      // Transfer Mono to Staking and Bank contracts and to accounts
      // ***************
      await MonoInstance.mint(
        StakingInstance.address,
        ethers.utils.parseEther("200000")
      );
      await MonoInstance.mint(
        BankInstance.address,
        ethers.utils.parseEther("1000000")
      );

      for (let index = 0; index < 2; index++) {
        await MonoInstance.mint(
          accounts[index],
          ethers.utils.parseEther("100000")
        );
      }

      // ***************
      // Add ERC20 tokens to stake
      // ***************
      NETWORK_TOKEN_VIRTUAL_ADDRESS =
        await StakingInstance.NETWORK_TOKEN_VIRTUAL_ADDRESS();

      // Add network token
      await StakingInstance.addPool(
        NETWORK_TOKEN_VIRTUAL_ADDRESS,
        MATIC_USD,
        110,
        "MATIC",
        "Matic Token",
        false
      );

      await StakingInstance.addPool(
        LINK,
        LinkUsdPriceFeedInstance.address,
        120,
        "LINK",
        "ChainLink Token",
        false
      );

      await StakingInstance.addPool(
        "0xa49a31df27460977c38356b9608ae24be1dd0b26", // Uniswap address for LP token
        MaticMonoPriceFeedInstance.address,
        123,
        "MATIC-MONO",
        "LP Matic-Mono",
        true
      );

      // ***************
      // Setup roles
      // ***************
      MINTER_ROLE = await PropInstance.MINTER_ROLE();
      await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: admin,
      });
      await PawnInstance.grantRole(MINTER_ROLE, BankInstance.address, {
        from: admin,
      });

      MANAGER_ROLE = await BoardInstance.MANAGER_ROLE();
      await BoardInstance.grantRole(MANAGER_ROLE, BankInstance.address, {
        from: admin,
      });

      // ***************
      // Setup Paris board prices
      // ***************
      commonLandPrices = [];
      Paris.lands.forEach((land, index) => {
        commonLandPrices[index] = 0;
        if (land.hasOwnProperty("commonPrice")) {
          commonLandPrices[index] = land.commonPrice;
        }
      });

      await BankInstance.setPrices(
        Paris.id,
        Paris.maxLands,
        Paris.maxLandRarities,
        Paris.rarityMultiplier,
        commonLandPrices,
        { from: admin }
      );

      // ***************
      // Give allowance for players to contract to spend all $MONO
      // ***************
      await MonoInstance.approve(
        BankInstance.address,
        ethers.utils.parseEther("100000"),
        {
          from: player1,
        }
      );

      // ***************
      // Allow Bank contract and OpenSea's ERC721 Proxy Address
      // ***************
      await PropInstance.setIsOperatorAllowed(BankInstance.address, true);
      await PropInstance.setIsOperatorAllowed(
        "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE",
        true
      );

      // ***************
      // Create pawn to players
      // ***************
      await PawnInstance.mint(player1);

      // ***************
      // Register pawns
      // ***************
      pawnID = await PawnInstance.tokenOfOwnerByIndex(player1, 0);
      await BoardInstance.register(Paris.id, pawnID, {
        from: admin,
      });

      console.warn("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");
      console.warn(
        `/!\\ You must fill Board contract (${BoardInstance.address})`
      );
      console.warn(`/!\\ and Bank contract (${BankInstance.address})`);
      console.warn(`/!\\ with LINK (${LINK}).`);
      console.warn("/!\\ LINK faucet https://faucets.chain.link/mumbai");
      console.warn("/!\\ Players must have some MATIC");
      console.warn("/!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\ /!\\");

      break;

    default:
      console.log(`Can't deploy contract on this network : ${network}.`);
  }

  console.log("...done.");
};
