const Pawn = artifacts.require("PawnContract");
const utils = require("./utils.js");

contract("Pawn", async (accounts) => {
  beforeEach(async function () {
    PawnInstance = await Pawn.new("NAME", "SYMBOL", "URI");

    deployer = accounts[0];
    minter = accounts[1];
    owner1 = accounts[2];
    owner2 = accounts[3];
    owner3 = accounts[4];

    PawnInstance.grantRole(await PawnInstance.MINTER_ROLE(), minter);
  });

  it("should allow new minter", async function () {
    await PawnInstance.grantRole(await PawnInstance.MINTER_ROLE(), minter);
    assert(
      await PawnInstance.hasRole(await PawnInstance.MINTER_ROLE(), minter),
      "test failure"
    );

    try {
      await PawnInstance.mint(owner1, {
        from: minter,
      });
    } catch (err) {
      assert(false, "test failure");
    }
  });

  it("should mint a pawn to owner2", async function () {
    let result = await PawnInstance.mint(owner2);
    let pawnID = result.logs[0].args["tokenId"].toString();
    expect((await PawnInstance.ownerOf(pawnID)).toString()).to.equal(owner2);
  });

  it("should get a pawn from its ID", async function () {
    let result = await PawnInstance.mint(owner1);
    let pawnID = result.logs[0].args["tokenId"].toString();

    //(pawn.subject, pawn.background, pawn.material, pawn.halo, pawn.power, pawn.level, pawn.xp) = await PawnInstance.get(pawnID);
    let pawn = await PawnInstance.get(pawnID);
    assert(pawn.subject != 0);
    assert(pawn.background != 0);
    assert(pawn.material != 0);
    assert(pawn.halo != 0);
    assert(pawn.power != 0);
  });
});
