const { BN, ether, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const constants = require('@openzeppelin/test-helpers/src/constants');
// const expectEvent = require('@openzeppelin/test-helpers/src/expectEvent');
const { expect } = require('chai');
const { assert } = require('console');
// const { address } = require('faker');

const Rogue = artifacts.require("Rogue");
const Tairreux = artifacts.require('Tairreux');

contract("stMPs.sol", (accounts) => {
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];

  let MPs;
  let stMPs;

  context("functions", function(){

    async function deposit(){
      await MPs.approve( stMPs.address, 100000, {from:player1});
      let result = await stMPs.depositAll({from:player1});
    }

    async function withdraw(){
      let result = await stMPs.withdrawAll({from:player1});
    }

    beforeEach(async () => {
      MPs = await Rogue.new({from:owner});
      stMPs = await Tairreux.new(MPs.address,{from:owner});
      await MPs.allow(owner,stMPs.address);
      MPs.mint(owner, 1000000);
      await	MPs.mint(player1, 100000);
    });

    it("... test de la fonction deposit all", async () => {
      await expectRevert(stMPs.depositAll({from:player2}),"You are a ZERO");
      await deposit();
      balance = await stMPs.balanceOf(player1);
      expect(balance.toNumber()).to.equal(100000, "not deposited");
    });

    it( "... test de la fonction withdraw all", async () => {
      await expectRevert(stMPs.withdrawAll({from:player2}),"you are able to speak.");
      await expectRevert(stMPs.withdrawAll({from:owner}),"you are able to speak.");
      await deposit();
      await withdraw();
      var balance = await stMPs.balanceOf(player1);
      expect(balance.toNumber()).to.equal(0, "not deposited");
    });

    it("... test du use case staking MP swap Token", async () => {
      var balance = await MPs.balanceOf(player1);
      await console.log("before", balance.toNumber());
      await deposit();
      await withdraw();
      balance = await MPs.balanceOf(player1);
      console.log("after ", balance.toNumber());
    });
  });
})



