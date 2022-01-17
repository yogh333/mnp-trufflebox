// BoardRandom.test.js

ethers = require("ethers");

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");

const VRFConsumerBase = artifacts.require("VRFConsumerBase");
const VRFCoordinator = artifacts.require("VRFCoordinatorContract");
const LinkForChainlinkVRF = artifacts.require("LinkForChainlinkVRF");

const truffleAssert = require("truffle-assertions");
const { assert, expect } = require("chai");
const { BN, time, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const tokenTransfers = require("truffle-token-test-utils");

contract("Board", async (accounts) => {

  const _contractOwner = accounts[0];
  const requestId = 0x6161;

  let BoardInstance, PawnInstance, VRFConsumerBaseInstance, LinkInstance;

  tokenTransfers.setWeb3(web3);

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
            {from: _contractOwner}
        );
    };

  describe("A. Test of the getRandomKeccak256() function", () => {
        before("SETUP", async () => {
            await initialSetUp();
        });

        it("1. Keccak return", async () => {

            const emptyArray = Array.from(Array(5));
            const results = [];

            for (const item of emptyArray) {

                const number = await BoardInstance.getRandomKeccak256();
                const latest = await time.latestBlock();
                await time.advanceBlockTo(parseInt(latest) + 20);

                results.push(Number(number.toString()));
            }

            assert(results.every(num => [1,2,3,4,5,6].includes(num)));
     });

  });

  describe("B. Test of the requestRandomNumber function", () => {

        beforeEach("SETUP", async () => {
            await initialSetUp();
        });

        it("2. Reverts if the LINK balance of the contract is lower than the fee", async function () {

            await BoardInstance.register(new BN(0), new BN(1));
            await expectRevert(BoardInstance.play(new BN(0), new BN(1)),
                "Not enough LINK - fill contract with faucet");
        });

        it("3. Pass if the LINK balance of the contract has enough fees", async function () {

            await BoardInstance.getFaucet(BoardInstance.address,web3.utils.toBN(new BN(30).mul(new BN(10).pow(new BN(28)))));

            await BoardInstance.register(new BN(0), new BN(1));
            await BoardInstance.play(new BN(0), new BN(1));
        });
    });

    describe("C. Test of the fulfillRandomness function", () => {

        before("SETUP", async () => {
            await initialSetUp();

        });

        it("7. Test if the random of PawnInfo is equal to the randomness generated in the test", async function() {

            await BoardInstance.register(new BN(0), new BN(1));

            const p = await BoardInstance.getPawnInfo(0,1);
            console.log(p.random);

            const VRFCoordinatorInstance = await VRFCoordinator.deployed();
            const requestID = await VRFCoordinatorInstance.getLastRequestID();
            const expectedRandomness = await VRFCoordinatorInstance.getLastRandomness();

            console.log(expectedRandomness);

            await VRFCoordinatorInstance.sendRandomness(requestID);

            assert.strictEqual(p.random.toString(),expectedRandomness.toString());
        });

        xit("8. Emits an event after the release of the random number", async function () {

            const randomness = 5;

            await BoardInstance.register(new BN(0), new BN(1));
            expectEvent(await BoardInstance.rawFulfillRandomness(requestId,randomness),
                'RandomReady', {requestId: web3.utils.hexToBytes(requestId) })
        });
    });

    describe.only("D. Test of the function play", () =>  {

        beforeEach("SETUP", async () => {
            await initialSetUp();
            await BoardInstance.getFaucet(BoardInstance.address,web3.utils.toBN(new BN(30).mul(new BN(10).pow(new BN(28)))));

        });

        //TODO
        xit("9. Reverts if the player isn't a manager", async function() {

            //bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
            let hasRole = await BankInstance.hasRole(ADMIN_ROLE, _contractOwner);
            await expectRevert(BoardInstance.play(new BN(0), new BN(1)),
                "XXXXX");
        });

        xit("10. Reverts playing if the paw is not registered", async function() {

            await expectRevert(BoardInstance.play(new BN(0), new BN(1)),
                "Unregistered pawn");
        });

        xit("11. Test random number related to the movement of the pawn", async () => {
            //Registering new pawn
            await BoardInstance.register(new BN(0), new BN(1));

            const random = 6;

            //Set the random number
            await BoardInstance.setRandom(random);

            const oldPositionPawn = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //We must deposit LINK tokens on the contract before

            //Call of the play method
            await BoardInstance.play(new BN(0), new BN(1));

            //Call of callback from ChainLink Oracle
            await BoardInstance.callbackRandom();

            let newPositionPawn = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Verification that the pawn has advanced according to the random number set + 2
            assert.strictEqual(parseInt(newPositionPawn[1]), parseInt(oldPositionPawn[1])+random+2);

        });

        it("12. We test the modulos, the bounds related to the movement of the pawn", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            const random = 11;

            //Set the random number
            await BoardInstance.setRandom(random);

            const newPositionP = 2;

            //Call of the play method
            await BoardInstance.play(new BN(0), new BN(1));

            //Call of callback from ChainLink Oracle
            await BoardInstance.callbackRandom();

            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Verification that the pawn has advanced according to the random number set + 2
            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionP));
            });

        it("13. We test the modulos, the bounds related to the movement of the pawn", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            const random = 5;

            //Set the random number
            await BoardInstance.setRandom(random);

            const newPositionP = 7;

            //Call of the play method
            await BoardInstance.play(new BN(0), new BN(1));

            //Call of callback from ChainLink Oracle
            await BoardInstance.callbackRandom();

            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Verification that the pawn has advanced according to the random number set + 2
            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionP));
        });






    });

    //TODO
    describe("E. In Bank.sol : test of the function rolldices", () => {

        xit("XXXXXX. Reverts if the player does not own a pawn")
    });


});
