// Board.test.js
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { ethers } = require("ethers");
const { BN } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnStubContract");
const Link = artifacts.require("LinkForChainlinkVRF");
const VRFCoordinator = artifacts.require("VRFCoordinatorContract");

contract("BoardContract", async (accounts) => {
  const deployer = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  let BoardInstance, PawnInstance, LinkInstance;

  beforeEach(async function () {
    BoardInstance = await Board.deployed();
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

  describe("#register() & #isRegistered()", () => {
    before("SETUP", async () => {
      PawnInstance = await Pawn.deployed();
      // Mint pawn to players
      await PawnInstance.mint(player1);
      // Register player 1 pawn
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player1, 0);
      await BoardInstance.register(0, _pawnID);
    });
    it("Player1 is registered", async () => {
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player1, 0);
      console.log("_pawnID.toString()", _pawnID.toString());
      assert.strictEqual(_pawnID.toString(), "1000");
      const isRegistered = await BoardInstance.isRegistered(0, _pawnID);
      assert.isTrue(isRegistered);
    });
    it("Player2 is not registered", async () => {
      await PawnInstance.mint(player2);
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player2, 0);
      const isRegistered = await BoardInstance.isRegistered(0, _pawnID);
      assert.isFalse(isRegistered);
    });
  });

  describe("#play() & #requestRandomNumber() & #fulfillRandomness()", () => {
    before("SETUP", async () => {});
    it("require a registered pawn", async () => {
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player2, 0);
      await truffleAssert.reverts(
        BoardInstance.play(0, _pawnID, {
          from: deployer,
        })
      );
    });
    it("Link balance of Board contract not be zero", async () => {
      LinkInstance = await Link.deployed();
      // test with a new board instance without any LINK
      const BoardInstance2 = await Board.new(
        "0x514910771af9ca656af840dff83e8264ecf986ca", // VRFCoordinator
        LinkInstance.address, // Link token
        "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4", // keyHash
        0.0001 * 10 ** 18 // ChainLink fee
      );
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player2, 0);
      await BoardInstance2.register(0, _pawnID, {
        from: deployer,
      });
      await truffleAssert.reverts(
        BoardInstance2.play(0, _pawnID, {
          from: deployer,
        }),
        "Not enough LINK - fill contract with faucet"
      );
    });
    it("Expected values in #fulfillRandomness()", async () => {
      const BoardBalanceBefore = await LinkInstance.balanceOf(
        BoardInstance.address
      );
      const _pawnID = await PawnInstance.tokenOfOwnerByIndex(player1, 0);
      const _result = await BoardInstance.play(0, _pawnID, {
        from: deployer,
      });
      const BoardBalanceAfter = await LinkInstance.balanceOf(
        BoardInstance.address
      );

      assert.isTrue(BoardBalanceBefore.gt(BoardBalanceAfter));
      assert.strictEqual(
        BoardBalanceBefore.sub(BoardBalanceAfter).toString(),
        ethers.utils.parseEther("0.0001").toString()
      );

      const VRFCoordinatorInstance = await VRFCoordinator.deployed();
      const requestID = await VRFCoordinatorInstance.getLastRequestID();
      const expectedRandomness =
        await VRFCoordinatorInstance.getLastRandomness();

      await VRFCoordinatorInstance.sendRandomness(requestID);

      //!\ return object, random BN is parsed to string
      const _pawnInfo = await BoardInstance.getPawnInfo(0, _pawnID);

      assert.strictEqual(
        _pawnInfo.random.toString(), // toString() is not necessary
        expectedRandomness.toString()
      );

      assert.strictEqual(
        expectedRandomness.mod(new BN(11)).add(new BN(2)).toString(),
        _pawnInfo.position
      );
      assert.isFalse(_pawnInfo.isPropertyBought);
      assert.isFalse(_pawnInfo.isRentPaid);
      assert.isFalse(_pawnInfo.isRoundCompleted);
    });
  });
});
