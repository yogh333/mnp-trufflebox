// Board.test.js

const Board = artifacts.require("BoardContract");

contract("BoardContract", async (accounts) => {
  beforeEach(async function () {
    BoardInstance = await Board.new(
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
      0.0001 * 10 ** 18
    );

    deployer = accounts[0];
  });

  it("should return proper number of lands ", async function () {
    expect((await BoardInstance.getNbLands(0)).toNumber()).to.equal(40);
  });

  it("Lands should have right purchasable status", async function () {
    const notPurchasableLands = [0, 2, 7, 10, 17, 20, 22, 30, 33, 36];

    for (let landID = 0; landID < 40; landID++) {
      BoardInstance.isPurchasable(0, landID).then((result) => {
        expect(result).to.equal(!notPurchasableLands.includes(landID));
      });
    }
  });

  it("should return proper max edition", async function () {
    expect((await BoardInstance.getMaxEdition()).toNumber()).to.equal(0);
  });

  it("should return proper rarity level", async function () {
    expect((await BoardInstance.getRarityLevel(0)).toNumber()).to.equal(2);
  });

  it("should deploy a new version", async function () {
    let b = {
      lands: 30,
      rarity_lvl: 10,
      purchasable_lands: [1, 2, 3, 6, 8],
      max_pawns: 100,
    };

    let result = await BoardInstance.newBoard(
      b.lands,
      b.rarity_lvl,
      b.purchasable_lands,
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
    //
    for (let index = 0; index < b.purchasable_lands.length; index++) {
      expect(
        await BoardInstance.isPurchasable(
          edition_nb,
          b.purchasable_lands[index]
        )
      ).to.equal(true);
    }
  });
});
