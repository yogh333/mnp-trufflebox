// BoardRandom.test.js

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");
const ChainLinkVRFStub = artifacts.require("ChainLinkVRFStub");

const truffleAssert = require("truffle-assertions");
const { assert, expect } = require("chai");
const { BN, time, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
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

      //LinkInstance = await ERC20TokenStub.new("Chainlink token", "LINK");
      //ChainLinkVRFInstance = await ChainLinkVRFStub.new();
  };

  describe("A. Test of the getRandomKeccak256() function", () => {
        before("SETUP", async () => {
            await initialSetUp();
        });

        it("1. Keccak return", async () => {

            const emptyArray = Array.from(Array(5));
            const results = [];

            for (const item of emptyArray) {

                const number = await boardInstance.getRandomKeccak256();
                const latest = await time.latestBlock();
                await time.advanceBlockTo(parseInt(latest) + 20);

                results.push(Number(number.toString()));
            }

            assert(results.every(num => [1,2,3,4,5,6].includes(num)));
     });

  });

    describe("B. Test of the requestRandomNumber function", () => {
        before("SETUP", async () => {
            await initialSetUp();

        });

        xit("2. Reverts request of random number if the paw is not registered", async function () {
            await expectRevert(boardInstance.requestRandomNumber(new BN(0), new BN(1)),
                "pawn has not been registered" );
        });

        //?
        xit("3. Reverts if the LINK balance of the contract is lower than the fee", async function () {
            let fee = new BN(10);

            //let balance = await web3.eth.getBalance(boardInstance.address);
            console.log('balance:', balance);

            await expectRevert(await web3.eth.getBalance(boardInstance.address),
                "Not enough LINK - fill contract with faucet");
        });

        xit("4. The state of the rolling dice must be true", async function() {

            await boardInstance.register(0,1);

            //feed the contract but how? with approve, transferFrom

            expect(await boardInstance.getRollingState(0,1)).to.equal(true);
        });

        xit("5. Emits an event after the sending of the request for a random number to Oracle chainlink", async () => {
            expectEvent( await boardInstance.requestRandomNumber(new BN(0), new BN(1), {from: _contractOwner}),
                'RandomNumberRequested', {player:_player1,requestId: XXX} )
        });

    });

    describe("C. Test of the getRandomNumbers function", () => {

        xit("6. Reverts request of random number if the paw is not registered", async function () {
            await expectRevert(boardInstance.requestRandomNumber(new BN(0), new BN(1)),
                "pawn has not been registered" );
        });
    });


    describe("D. Test of the fulfillRandomness function", () => {


    });






});
