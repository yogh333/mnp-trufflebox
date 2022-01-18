// BoardRandom.test.js

ethers = require("ethers");

const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");

const { assert, expect } = require("chai");
const { BN, time, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Board", async (accounts) => {

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
            {from: _contractOwner}
        );
    };

  describe("A. Test of the requestRandomNumber function", () => {

        beforeEach("SETUP", async () => {
            await initialSetUp();
        });

        it("2. Reverts if the LINK balance of the contract is lower than the fee", async function () {

            await BoardInstance.register(new BN(0), new BN(1));
            await expectRevert(BoardInstance.play(new BN(0), new BN(1)),
                "Not enough LINK - fill contract with faucet");
        });

        it("3. Pass if the LINK balance of the contract has enough fees", async function () {

            await BoardInstance.getFaucet(BoardInstance.address,web3.utils.toBN(new BN(30).mul(new BN(10).pow(new BN(48)))));

            await BoardInstance.register(new BN(0), new BN(1));
            await BoardInstance.play(new BN(0), new BN(1));
        });
    });

    describe("B. Test of the fulfillRandomness function", () => {

        before("SETUP", async () => {
            await initialSetUp();

        });

        xit("7. Test if the random of PawnInfo is equal to the randomness generated in the test", async function() {

            await BoardInstance.register(new BN(0), new BN(1));

            const p = await BoardInstance.getPawnInfo(0,1);
            console.log(p.random);

            const requestID = await BoardInstance.requestRandomness();
            const expectedRandomness = await BoardInstance.getLastRandomness();

            console.log(expectedRandomness);

            await BoardInstance.sendRandomness(requestID);

            assert.strictEqual(p.random.toString(),expectedRandomness.toString());
        });

        xit("8. Emits an event after the release of the random number", async function () {

            const randomness = 5;

            await BoardInstance.register(new BN(0), new BN(1));
            expectEvent(await BoardInstance.rawFulfillRandomness(requestId,randomness),
                'RandomReady', {requestId: web3.utils.hexToBytes(requestId) })
        });
    });

    describe("C. Test of the function play", () =>  {

        beforeEach("SETUP", async () => {
            await initialSetUp();
            await BoardInstance.getFaucet(BoardInstance.address,web3.utils.toBN(new BN(60).mul(new BN(10).pow(new BN(28)))));

        });


        xit("9. Reverts if the player isn't a manager", async function() {

            //const ADMIN_ROLE = "a49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";
            let hasRole = await BankInstance.hasRole("ADMIN_ROLE", _contractOwner);
            await expectRevert(BoardInstance.play(new BN(0), new BN(1) ));
        });

        it("10. Reverts playing if the paw is not registered", async function() {

            await expectRevert(BoardInstance.play(new BN(0), new BN(1)),
                "Unregistered pawn");
        });

        it("11. Test random number related to the movement of the pawn", async () => {

            //Registering new pawn
            await BoardInstance.register(new BN(0), new BN(1));

            const random = 6;

            //Set the random number
            await BoardInstance.setRandom(random);

            const oldPositionPawn = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Call of the play method
            await BoardInstance.play(new BN(0), new BN(1));

            //Call of callback from ChainLink Oracle
            await BoardInstance.callbackRandom();

            let newPositionPawn = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Verification that the pawn has advanced according to the random number set + 2
            assert.strictEqual(parseInt(newPositionPawn[1]), parseInt(oldPositionPawn[1])+random+2);

        });

        it("12.a. We test the modulos and the movement of the pawn -- random = 0", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            const random = 0;
            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 2;

            await BoardInstance.play(new BN(0), new BN(1));

            await BoardInstance.callbackRandom();

            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("12.b. We test the modulos and the movement of the pawn -- random = 1", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            const random = 1;
            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 3;

            await BoardInstance.play(new BN(0), new BN(1));

            await BoardInstance.callbackRandom();

            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("12.c. We test the modulos and the movement of the pawn -- random = 2", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            //const random = 11;
            const random = 2;
            //Set the random number
            await BoardInstance.setRandom(random);

            //const newPositionP = 2;
            const newPositionPawnProcessed = 4;

            //Call of the play method
            await BoardInstance.play(new BN(0), new BN(1));

            //Call of callback from ChainLink Oracle
            await BoardInstance.callbackRandom();

            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            //Verification that the pawn has advanced according to the position processed
            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("13. We test the modulos and the movement of the pawn -- random = 3", async() => {

            await BoardInstance.register(new BN(0), new BN(1));

            const random = 3;
            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 5;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("14. We test the modulos and the movement of the pawn -- random = 4", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 4;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 6;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("15. We test the modulos and the movement of the pawn -- random = 5", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 5;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 7;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("16. We test the modulos and the movement of the pawn -- random = 6", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 6;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 8;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("17. We test the modulos and the movement of the pawn -- random = 7", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 7;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 9;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("18. We test the modulos and the movement of the pawn -- random = 8", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 8;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 10;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("19. We test the modulos and the movement of the pawn -- random = 9", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 9;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 11;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("20. We test the modulos and the movement of the pawn -- random = 10", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 10;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 12;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("21. We test the modulos and the movement of the pawn -- random = 11", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 11;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 2;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("22. We test the modulos and the movement of the pawn -- random = 12", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 12;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 3;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("23. We test the modulos and the movement of the pawn -- random = 13", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 13;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 4;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("24. We test the modulos and the movement of the pawn -- random = 14", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 14;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 5;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("25. We test the modulos and the movement of the pawn -- random = 15", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 15;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 6;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("26. We test the modulos and the movement of the pawn -- random = 16", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 16;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 7;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("27. We test the modulos and the movement of the pawn -- random = 17", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 17;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 8;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("28. We test the modulos and the movement of the pawn -- random = 18", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 18;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 9;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("29. We test the modulos and the movement of the pawn -- random = 19", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 19;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 10;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("30. We test the modulos and the movement of the pawn -- random = 20", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 20;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 11;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("31. We test the modulos and the movement of the pawn -- random = 21", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 21;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 12;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("32. We test the modulos and the movement of the pawn -- random = 22", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 22;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 2;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("33. We test the modulos and the movement of the pawn -- random = 23", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 23;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 3;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

        it("34. We test the modulos and the movement of the pawn -- random = 24", async() => {

            await BoardInstance.register(new BN(0), new BN(1));
            const random = 24;

            await BoardInstance.setRandom(random);

            const newPositionPawnProcessed = 4;

            await BoardInstance.play(new BN(0), new BN(1));
            await BoardInstance.callbackRandom();
            let newPositionPawn2 = await BoardInstance.getPawnInfo(new BN(0), new BN(1));

            assert.strictEqual(parseInt(newPositionPawn2[1]), parseInt(newPositionPawnProcessed));
        });

    });

});
