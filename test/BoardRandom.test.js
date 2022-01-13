// BoardRandom.test.js

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");
const Bank = artifacts.require("BankContract");
const VRFConsumerBase = artifacts.require("VRFConsumerBase");

const truffleAssert = require("truffle-assertions");
const { assert, expect } = require("chai");
const { BN, time, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Board", async (accounts) => {
  const _contractOwner = accounts[0];
  //====================== ?
  const requestId = 0x0002;

  let boardInstance, pawnInstance, LinkInstance;

  let BankInstance;
  let BoardInstance;
  let BuildInstance;
  let MonoInstance;
  let PawnInstance;
  let PropInstance;
  let StakingInstance;
  let MonoUsdPriceFeedInstance;

  let ADMIN_ROLE;
  let BANKER_ROLE;

  const etherToWei = (ethers) => {
    return web3.utils.toWei(ethers.toString(), "ether");
  };

  const initialSetUp = async () => {
    pawnInstance = await Pawn.new("pawn", "PAWN", "https://server.com/pawn/", {
      from: _contractOwner,
    });

      VRFConsumerBaseInstance = await VRFConsumerBase.new(
          "0x514910771af9ca656af840dff83e8264ecf986ca",
          "0x514910771af9ca656af840dff83e8264ecf986ca",
          {from: _contractOwner});

    /*
    LinkInstance = await ERC20TokenStub.new("Chainlink token", "LINK", {
          from: _contractOwner,
    });


     */
    boardInstance = await Board.new(
        VRFConsumerBaseInstance.address,
        VRFConsumerBaseInstance.address,
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
      0.0001 * 10 ** 18,
      { from: _contractOwner }
    );
/*
    BankInstance = await Bank.new(
      PawnInstance.address,
      BoardInstance.address,
      PropInstance.address,
      BuildInstance.address,
      MonoInstance.address,
      LinkInstance.address,
      StakingInstance.address,
      { from: _contractOwner }
    );*/

    //ADMIN_ROLE = await BankInstance.ADMIN_ROLE();

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

  describe.only("B. Test of the requestRandomNumber function", () => {
        before("SETUP", async () => {
            await initialSetUp();
        });

        //====================== ?
        xit("2. Reverts if the LINK balance of the contract is lower than the fee", async function () {
            /*let fee = new BN(10);

            const kovanLinkAddress = 0xa36085F69e2889c224210F603D836748e7dC0088;
            await boardInstance.LINK(kovanLinkAddress).to(boardInstance.address);
            console.log('balance:', balance.toString());
             */

            //test with LinkForChainlinkVRF or ChainLinkVRFStub ERC20 token

            //await VRFConsumerBaseInstance.faucet(boardInstance.address,3 * 10 ** 18);

           // await expectRevert(boardInstance.play(new BN(0), new BN(1)),
           //     "XXXXX");
           await expectRevert(await VRFConsumerBaseInstance.play(0,1));


        });

      xit("2. Pass if the LINK balance of the contract has enough fees", async function () {
          /*let fee = new BN(10);

          const kovanLinkAddress = 0xa36085F69e2889c224210F603D836748e7dC0088;
          await boardInstance.LINK(kovanLinkAddress).to(boardInstance.address);
          console.log('balance:', balance.toString());
           */

          //test with LinkForChainlinkVRF or ChainLinkVRFStub ERC20 token

          await VRFConsumerBaseInstance.faucet(boardInstance.address,3 * 10 ** 18);


          await expect(await VRFConsumerBaseInstance.play(0,1));


      });
    });

    describe("C. Test of the fulfillRandomness function", () => {

        before("SETUP", async () => {
            await initialSetUp();

        });

        //====================== ?
        xit("6. We test the modulos, the bounds", async function() {

            //pseudo code, how we test the limits between 0 & 24

            //We test for the limit 0

            //We test for the limit 24

            //si le jet dé est entre 12


        });

        xit("7. Test if the random of boards is equal to the random of setRandom of ChaiLinkVRFStub.sol ", async function() {

            const random = 6;

            //Set the random number
            await chainLinkVRFInstance.setRandom(random);

            //assert.strictEqual

        });

        //====================== ?
        xit("8. Emits an event after the release of the random number", async function () {

            expectEvent(await boardInstance.fulfillRandomness(requestId,randomness),
                'RandomReady', {requestId: web3.utils.hexToBytes(requestId) })
        });
    });

    describe("D. Test of the function play", () =>  {

        before("SETUP", async () => {
            await initialSetUp();

        });

        //====================== ?
        xit("9. Reverts if the player isn't a manager", async function() {

            //bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

            let hasRole = await BankInstance.hasRole(ADMIN_ROLE, _contractOwner);
            await expectRevert(boardInstance.play(new BN(0), new BN(1)),
                "XXXXX");
        });

        xit("10. Reverts playing if the paw is not registered", async function() {

            await expectRevert(boardInstance.play(new BN(0), new BN(1)),
                "Unregistered pawn");
        });

        it("11. Test random number related to the movement of the pawn", async () => {
            //Registering new pawn
            await boardInstance.register(new BN(0), new BN(1));

            const random = 6;
            //Set the random number
            await chainLinkVRFInstance.setRandom(random);

            const oldPositionPawn = await boardInstance.getPawn(new BN(0), new BN(1)).position;

            //Call of the play method
            await boardInstance.play(new BN(0), new BN(1));

            const newPositionPawn = await boardInstance.getPawn(new BN(0), new BN(1)).position;

            //Verification that the pawn has advanced according to the random number set + 2
            assert.strictEqual(newPositionPawn, oldPositionPawn+random+2);

        });

    });

    //====================== ? must be tested or not?
    describe("E. In Bank.sol : test of the function rolldices", () => {

        xit("12. Reverts if the player does not own a pawn")
    });


});
