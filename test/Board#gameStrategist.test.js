// Board#gameStrategist.test.js
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { ethers } = require("ethers");
const { BN } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const Board = artifacts.require("BoardGameStrategistTest");

contract("Board contract", async (accounts) => {
  const deployer = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  let BoardInstance, pawnID, isPurchasableLand, _pawnInfo, initialPawnInfo;

  describe("#GameStrategist()", () => {
    before("SETUP", async () => {
      BoardInstance = await Board.new();
      pawnID = await BoardInstance.pawnID();
    });
    it("initialization", async () => {
      isPurchasableLand = await BoardInstance.isPurchasable(0, 0);
      assert.isFalse(isPurchasableLand);
      _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
      assert.strictEqual(_pawnInfo.position, "0");
      assert.strictEqual(_pawnInfo.random, "0");
      assert.isTrue(_pawnInfo.isOnBoard);
      assert.isTrue(_pawnInfo.isRoundCompleted);
      assert.isFalse(_pawnInfo.isPropertyBought);
      assert.isFalse(_pawnInfo.isRentPaid);
      assert.isFalse(_pawnInfo.isInJail);
      assert.isFalse(_pawnInfo.isChanceCard);
      assert.isFalse(_pawnInfo.isCommunityCard);

      initialPawnInfo = _pawnInfo;
    });
    it("purchasable lands", async () => {
      const notPurchasableLands = [0, 2, 7, 10, 17, 20, 22, 30, 33, 36];
      for (let landID = 1; landID < 40; landID++) {
        if (notPurchasableLands.includes(landID)) continue;

        await BoardInstance.setPosition(0, pawnID, landID);
        await BoardInstance.gameStrategist(0, pawnID, landID);
        _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
        assert.strictEqual(_pawnInfo.position, landID.toString());
        assert.isTrue(_pawnInfo.isOnBoard);
        assert.isFalse(_pawnInfo.isRoundCompleted); //
        assert.isFalse(_pawnInfo.isPropertyBought);
        assert.isFalse(_pawnInfo.isRentPaid);
        assert.isFalse(_pawnInfo.isInJail);
        assert.isFalse(_pawnInfo.isChanceCard);
        assert.isFalse(_pawnInfo.isCommunityCard);
      }
    });
    it("Chance card", async () => {
      const chanceLands = [7, 22, 36];
      for (let landID = 1; landID < 40; landID++) {
        if (!chanceLands.includes(landID)) continue;

        await BoardInstance.setPosition(0, pawnID, landID);
        await BoardInstance.gameStrategist(0, pawnID, landID);
        _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
        assert.strictEqual(_pawnInfo.position, landID.toString());
        assert.isTrue(_pawnInfo.isOnBoard);
        assert.isFalse(_pawnInfo.isRoundCompleted); //
        assert.isFalse(_pawnInfo.isPropertyBought);
        assert.isFalse(_pawnInfo.isRentPaid);
        assert.isFalse(_pawnInfo.isInJail);
        assert.isTrue(_pawnInfo.isChanceCard); //
        assert.isFalse(_pawnInfo.isCommunityCard);
      }
    });
    it("Community chest card", async () => {
      const communityChestLands = [2, 17, 33];
      for (let landID = 1; landID < 40; landID++) {
        if (!communityChestLands.includes(landID)) continue;

        await BoardInstance.setPosition(0, pawnID, landID);
        await BoardInstance.gameStrategist(0, pawnID, landID);
        _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
        assert.strictEqual(_pawnInfo.position, landID.toString());
        assert.isTrue(_pawnInfo.isOnBoard);
        assert.isFalse(_pawnInfo.isRoundCompleted); //
        assert.isFalse(_pawnInfo.isPropertyBought);
        assert.isFalse(_pawnInfo.isRentPaid);
        assert.isFalse(_pawnInfo.isInJail);
        assert.isFalse(_pawnInfo.isChanceCard);
        assert.isTrue(_pawnInfo.isCommunityCard); //
      }
    });
    it("Go to jail", async () => {
      landID = 30;
      await BoardInstance.setPosition(0, pawnID, landID);
      await BoardInstance.gameStrategist(0, pawnID, landID);
      _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
      assert.strictEqual(_pawnInfo.position, "10"); //
      assert.isTrue(_pawnInfo.isOnBoard);
      assert.isTrue(_pawnInfo.isRoundCompleted);
      assert.isFalse(_pawnInfo.isPropertyBought);
      assert.isFalse(_pawnInfo.isRentPaid);
      assert.isTrue(_pawnInfo.isInJail); //
      assert.isFalse(_pawnInfo.isChanceCard);
      assert.isFalse(_pawnInfo.isCommunityCard);
    });
    it("Free park", async () => {
      landID = 20;
      await BoardInstance.setPosition(0, pawnID, landID);
      await BoardInstance.gameStrategist(0, pawnID, landID);
      _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
      assert.strictEqual(_pawnInfo.position, landID.toString());
      assert.isTrue(_pawnInfo.isOnBoard);
      assert.isTrue(_pawnInfo.isRoundCompleted);
      assert.isFalse(_pawnInfo.isPropertyBought);
      assert.isFalse(_pawnInfo.isRentPaid);
      assert.isFalse(_pawnInfo.isInJail);
      assert.isFalse(_pawnInfo.isChanceCard);
      assert.isFalse(_pawnInfo.isCommunityCard);
    });
    it("Jail simple visit", async () => {
      landID = 10;
      await BoardInstance.setPosition(0, pawnID, landID);
      await BoardInstance.gameStrategist(0, pawnID, landID);
      _pawnInfo = await BoardInstance.getPawnInfo(0, pawnID);
      assert.strictEqual(_pawnInfo.position, landID.toString());
      assert.isTrue(_pawnInfo.isOnBoard);
      assert.isTrue(_pawnInfo.isRoundCompleted);
      assert.isFalse(_pawnInfo.isPropertyBought);
      assert.isFalse(_pawnInfo.isRentPaid);
      assert.isFalse(_pawnInfo.isInJail);
      assert.isFalse(_pawnInfo.isChanceCard);
      assert.isFalse(_pawnInfo.isCommunityCard);
    });
  });
});
