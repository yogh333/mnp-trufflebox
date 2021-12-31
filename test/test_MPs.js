const { BN, ether, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { assert } = require('console');

const Rogue = artifacts.require('Rogue');

contract("Mps.sol", function (accounts){
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];

  let MPs;

  context("fonctions", function() {
    const zero_address = "0x0000000000000000000000000000000000000000";
    beforeEach(async function () {
      MPs = await Rogue.new({from:owner});
    });
    it("... test de la fonction allow", async () => {
      let result = await expectRevert(MPs.allow(player1, player2, {from:player1}),"only owner can call this method");
    });

    it("... test de la fonction mint", async () => {
      await expectRevert(MPs.mint(owner, 1000000, {from:owner}),"minting is not enable");
      let faucet1 = player1;
      let faucet2 = player2;
      result = await MPs.allow(faucet1,faucet2, {from:owner});

      let _result = await MPs.mint(owner, 1000000, {from:faucet1});
      expectEvent(_result, 'Transfer', {from: zero_address, to: owner});

      let balance = await MPs.balanceOf(owner);
      balance = balance.toNumber();
      expect(balance).to.equal(1000000, "balance != mint");
    });
  });
})























