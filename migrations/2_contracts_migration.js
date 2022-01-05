Paris = require("../client/src/data/Paris.json");

const Pawn = artifacts.require("PawnContract");
const Mono = artifacts.require("MonoContract");
const Board = artifacts.require("BoardContract");
const Prop = artifacts.require("PropContract");
const Build = artifacts.require("BuildContract");
const Bank = artifacts.require("BankContract");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Mono, web3.utils.toWei("15000", "ether"));
  const MonoInstance = await Mono.deployed();

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

  const amount = web3.utils.toWei("1000", "ether");

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
