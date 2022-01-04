const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");
const Build = artifacts.require("BuildContract");
const utils = require("./utils.js");

contract("BuildContract", async (accounts) => {
  beforeEach(async function () {
    PawnInstance = await Pawn.new("NAME", "SYMBOL", "URI");
    BoardInstance = await Board.new(PawnInstance.address);
    BuildInstance = await Build.new(
      BoardInstance.address,
      "https://token-cdn/"
    );

    deployer = accounts[0];
    minter = accounts[1];
    owner1 = accounts[2];
    owner2 = accounts[3];
    owner3 = accounts[4];
  });

  it("should allow new minter", async function () {
    await BuildInstance.grantRole(await BuildInstance.MINTER_ROLE(), minter);
    assert(
      await BuildInstance.hasRole(await BuildInstance.MINTER_ROLE(), minter),
      "bad role for minter"
    );

    try {
      await BuildInstance.mint(owner1, 0, 1, 0, 10, { from: minter });
    } catch (err) {
      assert(false, "test failure");
    }
  });

  it("should mint 10 builds with build_type = 0 to owner1", async function () {
    let b = {
      edition: 0,
      land: 1,
      type: 0,
    };

    let result = await BuildInstance.mint(
      owner1,
      b.edition,
      b.land,
      b.type,
      10
    );

    let id = result.logs[0].args["id"];
    let balance = await BuildInstance.balanceOf(owner1, id.toString());
    expect(balance.toNumber()).to.equal(10);
    let supply = await BuildInstance.totalSupply(id.toString());
    expect(supply.toNumber()).to.equal(10);
  });

  it("should mint 5 builds with build_type = 1 to owner2", async function () {
    let b = {
      edition: 0,
      land: 1,
      type: 1,
    };

    let result = await BuildInstance.mint(owner2, b.edition, b.land, b.type, 5);

    let id = result.logs[0].args["id"];
    let balance = await BuildInstance.balanceOf(owner2, id.toString());
    expect(balance.toNumber()).to.equal(5);
    let supply = await BuildInstance.totalSupply(id.toString());
    expect(supply.toNumber()).to.equal(5);
  });

  it("should revert when trying to mint unknown build_type", async function () {
    try {
      await BuildInstance.mint(owner1, 0, 1, 2, 5);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should revert when trying to mint for unknown edition", async function () {
    try {
      await BuildInstance.mint(owner2, 1, 1, 2, 5);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });
});
