require("dotenv").config();

ethers = require("ethers");

Paris = require("../client/src/data/Paris.json");

const Link = artifacts.require("Link");
const Mono = artifacts.require("MonoContract");

const LinkUsdPriceFeed = artifacts.require("LinkUsdPriceFeed");
const MaticUsdPriceFeed = artifacts.require("MaticUsdPriceFeed");
const MonoUsdPriceFeed = artifacts.require("MonoUsdPriceFeed");

const Bank = artifacts.require("BankContract");
const Board = artifacts.require("BoardContract");
const Build = artifacts.require("BuildContract");
const Pawn = artifacts.require("PawnContract");
const Prop = artifacts.require("PropContract");
const Staking = artifacts.require("Staking");

let LinkInstance,
  MonoInstance,
  LinkUsdPriceFeedInstance,
  MaticUsdPriceFeedInstance,
  MonoUsdPriceFeedInstance;

module.exports = async function (deployer, network, accounts) {
  /*if (process.env.IS_SETUP) {
    // deploy ERC20 token contracts and price feeds and use these addresses in following deployment
    switch (network) {
      case "development":
        // ERC20 tokens
        await deployer.deploy(Mono, ethers.utils.parseEther("15000"));
        MonoInstance = await Mono.deployed();

        await deployer.deploy(Link);
        LinkInstance = await Link.deployed();

        // Price feeds
        await deployer.deploy(MonoUsdPriceFeed, 0.01 * 10 ** 8);
        MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();
        /!*let latestRoundData = await MonoUsdPriceFeedInstance.latestRoundData();
        console.log("MonoUsdPriceFeed");
        console.log(latestRoundData.answer.toNumber() / 10 ** 8);*!/

        await deployer.deploy(MaticUsdPriceFeed, 2.48 * 10 ** 8);
        MaticUsdPriceFeedInstance = await MaticUsdPriceFeed.deployed();

        await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
        LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

        break;

      case "mumbai":
        // Using an already deployed LINK
        // const linkAddress = "0x...."

        break;
      default:
        alert(`Can't deploy contract on this network : ${network}.`);
    }

    return;
  }*/

  // deploy ERC20 token contracts and price feeds and use these addresses in following deployment
  switch (network) {
    case "development":
      // ERC20 tokens
      await deployer.deploy(Mono, ethers.utils.parseEther("15000"));
      MonoInstance = await Mono.deployed();

      await deployer.deploy(Link);
      LinkInstance = await Link.deployed();

      // Price feeds
      await deployer.deploy(MonoUsdPriceFeed, 0.01 * 10 ** 8);
      MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.deployed();
      /*let latestRoundData = await MonoUsdPriceFeedInstance.latestRoundData();
      console.log("MonoUsdPriceFeed");
      console.log(latestRoundData.answer.toNumber() / 10 ** 8);*/

      await deployer.deploy(MaticUsdPriceFeed, 2.48 * 10 ** 8);
      MaticUsdPriceFeedInstance = await MaticUsdPriceFeed.deployed();

      await deployer.deploy(LinkUsdPriceFeed, 21.86 * 10 ** 8);
      LinkUsdPriceFeedInstance = await LinkUsdPriceFeed.deployed();

      break;

    case "mumbai":
      // Using an already deployed LINK
      // const linkAddress = "0x...."

      break;
    default:
      alert(`Can't deploy contract on this network : ${network}.`);
  }

  await deployer.deploy(Pawn, "MNW Pawns", "MWPa", "http://token-cdn-uri/");
  const PawnInstance = await Pawn.deployed();

  await deployer.deploy(Board);
  const BoardInstance = await Board.deployed();

  await deployer.deploy(
    Prop,
    BoardInstance.address,
    "MNW Properties",
    "MWP",
    "http://token-cdn-uri/"
  );

  await deployer.deploy(Build, BoardInstance.address, "http://token-cdn-uri/");

  const PropInstance = await Prop.deployed();
  const BuildInstance = await Build.deployed();

  await deployer.deploy(
    Bank,
    PawnInstance.address,
    BoardInstance.address,
    PropInstance.address,
    BuildInstance.address,
    MonoInstance.address
  );

  const BankInstance = await Bank.deployed();

  switch (network) {
    case "development":
      await LinkInstance.faucet(
        BankInstance.address,
        ethers.utils.parseEther("1500")
      );

      console.log("LinkInstance.balanceOf(BankInstance.address)");
      let balance = await LinkInstance.balanceOf(BankInstance.address);
      console.log(ethers.utils.formatUnits(balance.toString(), "ether"));

      await deployer.deploy(
        Staking,
        MonoInstance.address,
        MonoUsdPriceFeedInstance.address,
        "100"
      );
      const StakingInstance = await Staking.deployed();
      await MonoInstance.mint(
        StakingInstance.address,
        ethers.utils.parseEther("2000")
      );

      break;

    case "mumbai":
      // Price feeds are stored with Staking informations
      // MATIC / USD	8	0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
      // LINK / USD and MONO / USD are owned simulate feed contracts

      break;

    default:
      alert(`Can't deploy contract on this network : ${network}.`);
  }

  // Setup roles
  // Bank mint Prop & Build
  const MINTER_ROLE = await PropInstance.MINTER_ROLE();
  await PropInstance.grantRole(MINTER_ROLE, BankInstance.address, {
    from: accounts[0],
  });
  await BuildInstance.grantRole(MINTER_ROLE, BankInstance.address, {
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

  const amount = ethers.utils.parseEther("1000");

  await MonoInstance.mint(accounts[1], amount);

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
};
