// Board.test.js

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");

const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { BN, time } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Board", async (accounts) => {
  const _contractOwner = accounts[0];
  let boardInstance, pawnInstance;

  const etherToWei = (ethers) => {
    return web3.utils.toWei(ethers.toString(), "ether");
  };

  const initialSetUp = async () => {
    pawnInstance = await Pawn.new("pawn", "PAWN", "https://server.com/pawn/", {
      from: _contractOwner,
    });
    boardInstance = await Board.new(
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x514910771af9ca656af840dff83e8264ecf986ca",
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
      0.0001 * 10 ** 18,
      { from: _contractOwner }
    );
  };

  /*describe("Test of the random function", () => {
        before("SETUP", async () => {
            await initialSetUp();
        });

        it("Keccak return", async () => {

            const emptyArray = Array.from(Array(5));
            const results = [];

            for (const item of emptyArray) {
                const latest = await time.latestBlock();
                //console.log("Current block where I am:", ${latest});
                const number = await boardInstance.getRandomKeccak256();

                await time.advanceBlockTo(parseInt(latest) + 20);

                const current = await time.latestBlock();
                //console.log(" After the operation of ",time.advanceBlockTo, " I am here in this block:" ${current});
                results.push(Number(number.toString()));
            }
            console.log('result', results);

            assert(results.every(num => [1,2,3,4,5,6].includes(num)));
        });

    });*/
});
