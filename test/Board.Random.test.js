// BoardRandom.test.js

ethers = require("ethers");

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");

const { assert, expect } = require("chai");
const {
  BN,
  time,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Board - Related to random", async (accounts) => {
  const _contractOwner = accounts[0];
  const requestId = 0x6161;

  let BoardInstance, PawnInstance;

  const initialSetUp = async () => {
    PawnInstance = await Pawn.new("pawn", "PAWN", "https://server.com/pawn/", {
      from: _contractOwner,
    });

    BoardInstance = await Board.new(
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
      //1,
      1,
      { from: _contractOwner }
    );
  };
});
