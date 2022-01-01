const Board = artifacts.require("BoardContract");
const utils = require("./utils.js");


contract("BoardContract", async (accounts) => {
  beforeEach(async function () {
    BoardInstance = await Board.new();

    deployer = accounts[0];
  });

  it("should return proper number of lands ", async function () {
    expect((await BoardInstance.getNbLands(0)).toNumber()).to.equal(40);
  });

  it("should return true when land is a building plot", async function () {
    expect(await BoardInstance.isBuildingLand(0, 1)).to.equal(true);
  });

  it("should return false when a land is not a building plot", async function () {
    expect(await BoardInstance.isBuildingLand(0, 0)).to.equal(false);
  });

  it("should return proper max edition", async function () {
    expect((await BoardInstance.getMaxEdition()).toNumber()).to.equal(0);
  });

  it("should return proper rarity level", async function () {
    expect((await BoardInstance.getRarityLevel(0)).toNumber()).to.equal(2);
  });

  it("should return proper build type", async function () {
    expect((await BoardInstance.getBuildType(0)).toNumber()).to.equal(1);
  });

  it("should deploy a new version", async function () {
    let b = {
      lands: 30,
      rarity_lvl: 10,
      build_lvl: 4,
      buildings: [1, 2, 3, 6, 8],
      max_pawns: 100,
    };

    let result = await BoardInstance.newBoard(
      b.lands,
      b.rarity_lvl,
      b.buildings,
      b.build_lvl,
      b.max_pawns
    );

    let edition_nb = result.logs[0].args["new_edition_nb"].toNumber();
    expect((await BoardInstance.getMaxEdition()).toNumber()).to.equal(1);
    expect((await BoardInstance.getNbLands(edition_nb)).toNumber()).to.equal(
      b.lands
    );
    expect(
      (await BoardInstance.getRarityLevel(edition_nb)).toNumber()
    ).to.equal(b.rarity_lvl);
    expect((await BoardInstance.getBuildType(edition_nb)).toNumber()).to.equal(
      b.build_lvl
    );
    for (let i = 0; i < b.buildings.length; i++) {
      expect(
        await BoardInstance.isBuildingLand(edition_nb, b.buildings[i])
      ).to.equal(true);
    }
  });

});
