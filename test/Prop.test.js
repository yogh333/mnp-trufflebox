const Board = artifacts.require("BoardContract");
const Pawn = artifacts.require("PawnContract");
const Prop = artifacts.require("PropContract");
const utils = require("./utils.js");

contract("PropContract", async (accounts) => {
  beforeEach(async function () {
    PawnInstance = await Pawn.new("NAME", "SYMBOL", "URI");
    BoardInstance = await Board.new(PawnInstance.address);
    PropInstance = await Prop.new(
      BoardInstance.address,
      "TMWPROP",
      "PROP",
      "https://token-cdn/"
    );

    deployer = accounts[0];
    minter = accounts[1];
    owner1 = accounts[2];
    owner2 = accounts[3];
    owner3 = accounts[4];

    PropInstance.grantRole(await PropInstance.MINTER_ROLE(), minter);
  });

  it("should allow new minter", async function () {
    await PropInstance.grantRole(await PropInstance.MINTER_ROLE(), minter);
    assert(
      await PropInstance.hasRole(await PropInstance.MINTER_ROLE(), minter),
      "test failure"
    );

    try {
      await PropInstance.mint(owner1, 0, 1, 2, {
        from: minter,
      });
    } catch (err) {
      assert(false, "test failure");
    }
  });

  it("should mint a PROP with rarity_lvl = 0 to owner1", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 0,
    };

    let result = await PropInstance.mint(owner1, p.edition, p.land, p.rarity);

    let tokenID = result.logs[0].args["tokenId"].toString();
    expect((await PropInstance.ownerOf(tokenID)).toString()).to.equal(owner1);
  });

  it("should mint 2 PROPs with rarity_lvl = 1: one to owner1 and one to owner2", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 1,
    };

    let result = await PropInstance.mint(owner1, p.edition, p.land, p.rarity);

    expect((await PropInstance.balanceOf(owner1)).toNumber()).to.equal(1);

    result = await PropInstance.mint(owner2, 0, 1, 1);

    expect((await PropInstance.balanceOf(owner2)).toNumber()).to.equal(1);
  });

  it("should fail to mint two PROPs for the same land with rarity_lvl = 0", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 0,
    };

    let result = await PropInstance.mint(owner1, p.edition, p.land, p.rarity);

    try {
      await PropInstance.mint(owner1, p.edition, p.land, p.rarity);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("proper number of minted PROPs shall be returned", async function () {
    let nb_minted_prop = Math.round(Math.random() * 100);
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    for (let i = 0; i < nb_minted_prop; i++) {
      let user = accounts[i % accounts.length];
      let result = await PropInstance.mint(user, p.edition, p.land, p.rarity);
    }
    expect((await PropInstance.totalSupply()).toNumber()).to.equal(
      nb_minted_prop
    );
  });

  it("should return the proper number of minted PROPs for a specific land and rarity", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    let nb_minted_prop = Math.round(Math.random() * 10 ** p.rarity);
    for (let i = 0; i < nb_minted_prop; i++) {
      let user = accounts[i % accounts.length];
      let result = await PropInstance.mint(user, p.edition, p.land, p.rarity);
    }

    expect(
      (await PropInstance.getNbOfProps(p.edition, p.land, p.rarity)).toNumber()
    ).to.equal(nb_minted_prop);
  });

  it("should return the proper PROP when using PROP's ID", async function () {
    let pin = {
      edition: 0,
      land: 39,
      rarity: 1,
    };

    let result = await PropInstance.mint(
      owner1,
      pin.edition,
      pin.land,
      pin.rarity
    );

    let propID = result.logs[0].args["tokenId"];
    let pout = await PropInstance.get(propID.toString());
    expect((pout.edition, pout.land, pout.rarity, pout.serial)).to.equal(
      (pin.edition.toString(), pin.land.toString(), pin.rarity.toString(), "0")
    );
  });

  it("should return true when using an existing PROP's ID", async function () {
    let p = {
      edition: 0,
      land: 39,
      rarity: 1,
    };

    let result = await PropInstance.mint(owner1, p.edition, p.land, p.rarity);

    let propID = result.logs[0].args["tokenId"];
    expect(await PropInstance.exists(propID.toString())).to.be.true;
  });

  it("should return false when using an unknown PropInstance's ID", async function () {
    expect(await PropInstance.exists("123456789")).to.be.false;
  });

  it("should mint all PROPs for one land", async function () {
    for (let r = 0; r < 3; r++) {
      for (let n = 0; n < 10 ** r; n++) {
        let prop = {
          edition: 0,
          land: 37,
          rarity: r,
          serial: n,
        };
        let result = await PropInstance.mint(
          owner1,
          prop.edition,
          prop.land,
          prop.rarity
        );

        let propID = result.logs[0].args["tokenId"];
        let pout = await PropInstance.get(propID.toString());
        expect(pout.edition).to.equal(prop.edition.toString());
        expect(pout.land).to.equal(prop.land.toString());
        expect(pout.rarity).to.equal(prop.rarity.toString());
        expect(pout.serial).to.equal(prop.serial.toString());
      }
    }
  });

  it("should fail when trying to mint a PROP for a land with all PROPs already minted", async function () {
    for (let r = 0; r < 3; r++) {
      for (let n = 0; n < 10 ** r; n++) {
        let prop = {
          edition: 0,
          land: 37,
          rarity: r,
        };
        let result = await PropInstance.mint(
          owner1,
          prop.edition,
          prop.land,
          prop.rarity
        );
      }
    }

    for (let r = 0; r < 3; r++) {
      try {
        await PropInstance.mint(owner1, 0, 37, r);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        return;
      }
      assert(false, "test did not revert");
    }
  });

  it("should mint a two PROPs with rarity = 0 for the same land but different editions", async function () {
    await PropInstance.mint(owner1, 0, 37, 0);

    await BoardInstance.newBoard(40, 2, [37], 2, 100);

    await PropInstance.mint(owner1, 1, 37, 0);

    expect((await PropInstance.balanceOf(owner1)).toNumber()).to.equal(2);
  });

  it("should fail to mint a PROP for non-allowed land", async function () {
    try {
      await PropInstance.mint(owner1, 0, 0, 1);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should return total number of tokens", async function () {
    let nb_minted_prop = Math.round(Math.random() * 100);

    for (let i = 0; i < nb_minted_prop; i++) {
      await PropInstance.mint(owner1, 0, 37, 2);
    }

    let totalSupply = await PropInstance.totalSupply();
    expect(totalSupply.toNumber()).to.be.equal(nb_minted_prop);
  });
});
