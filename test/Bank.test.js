const Pawn = artifacts.require("PawnContract");
const Board = artifacts.require("BoardContract");
const Prop = artifacts.require("PropContract");
const Build = artifacts.require("BuildContract");
const Bank = artifacts.require("BankContract");
const Mono = artifacts.require("MonoContract");

const utils = require("./utils.js");

contract("BankContract", async (accounts) => {
  /*type Prop = {
    edition: number,
    land: number,
    rarity: number,
  };

  type Build = {
    edition: number,
    land: number,
    type: number,
  };*/

  beforeEach(async function () {
    let max_supply = web3.utils.toBN(accounts.length * 5000);
    MonoInstance = await Mono.new(web3.utils.toWei(max_supply, "ether"));

    /* mint 5000 $MONO to every account */
    for (let i = 0; i < accounts.length; i++) {
      await MonoInstance.mint(accounts[i], web3.utils.toWei("5000", "ether"));
    }

    /* Deploy Board */
    PawnInstance = await Pawn.new("NAME", "SYMBOL", "URI");
    BoardInstance = await Board.new(PawnInstance.address);

    /* Deploy Prop */
    PropInstance = await Prop.new(
      BoardInstance.address,
      "TMWPROP",
      "PROP",
      "https://token-cdn/"
    );

    /* Deploy Build */
    BuildInstance = await Build.new(
      BoardInstance.address,
      "https://token-cdn/"
    );

    /* Deploy Bank */
    BankInstance = await Bank.new(
      PawnInstance.address,
      BoardInstance.address,
      PropInstance.address,
      BuildInstance.address,
      MonoInstance.address
    );

    /* grant MINTER_ROLE to Bank smartcontract */
    await PropInstance.grantRole(
      await PropInstance.MINTER_ROLE(),
      BankInstance.address
    );
    await BuildInstance.grantRole(
      await BuildInstance.MINTER_ROLE(),
      BankInstance.address
    );

    user1 = accounts[1];
    user2 = accounts[2];
  });

  it("should GET price of Prop(0,1,2)", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };
    let price = await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity);
    expect(price.toString()).to.equal(web3.utils.toWei("0", "ether"));
  });

  it("should SET price of Prop(0,1,2)", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    let price = web3.utils.toWei("6", "ether");

    await BankInstance.setPriceOfProp(p.edition, p.land, p.rarity, price);
    let price_out = await BankInstance.getPriceOfProp(
      p.edition,
      p.land,
      p.rarity
    );
    expect(price_out.toString()).to.equal(price);
  });

  it("should REVERT when trying to get non allowed property's price", async function () {
    let p = {
      edition: 0,
      land: 2,
      rarity: 2,
    };
    try {
      await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should REVERT when trying to set non allowed property's price", async function () {
    let p = {
      edition: 0,
      land: 2,
      rarity: 2,
    };
    let price = web3.utils.toWei("6000", "ether");
    try {
      await BankInstance.setPriceOfProp(p.edition, p.land, p.rarity, price);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should GET price of Build(0, 1, 1)", async function () {
    let b = {
      edition: 0,
      land: 1,
      type: 1,
    };
    let price = await BankInstance.getPriceOfBuild(b.edition, b.land, b.type);
    expect(price.toString()).to.equal(web3.utils.toWei("0", "ether"));
  });

  it("should SET price of Build(0,1,1)", async function () {
    let b = {
      edition: 0,
      land: 1,
      type: 1,
    };

    let price = web3.utils.toWei("4", "ether");

    await BankInstance.setPriceOfBuild(b.edition, b.land, b.type, price);
    let price_out = await BankInstance.getPriceOfBuild(
      b.edition,
      b.land,
      b.type
    );
    expect(price_out.toString()).to.equal(price);
  });

  it("should REVERT when trying to get non allowed build's price", async function () {
    let b = {
      edition: 0,
      land: 2,
      type: 1,
    };
    try {
      await BankInstance.getPriceOfBuild(b.edition, b.land, b.type);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should REVERT when trying to set non allowed build's price", async function () {
    let b = {
      edition: 0,
      land: 2,
      type: 1,
    };

    let price = web3.utils.toWei("4", "ether");

    try {
      await BankInstance.setPriceOfBuild(b.edition, b.land, b.type, price);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should REVERT when trying to get price of an unknown PROP", async function () {
    let p = {
      edition: 99,
      land: 1,
      rarity: 2,
    };

    try {
      await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity);
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      p.edition = 0;
      p.land = 99;
      try {
        await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity);
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        p.land = 1;
        p.rarity = 5;
        try {
          await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity);
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
          return;
        }
        assert(false, "test did not revert");
      }
      assert(false, "test did not revert");
    }
    assert(false, "test did not revert");
  });

  it("should REVERT when trying to BUY an unknown PROP", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    await BankInstance.setPriceOfProp(
      p.edition,
      p.land,
      p.rarity,
      web3.utils.toWei("100", "ether")
    );

    let price = await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity, {
      from: user1,
    });
    await MonoInstance.approve(BankInstance.address, price.toString(), {
      from: user1,
    });

    p.edition = 99;
    try {
      await BankInstance.buyProp(p.edition, p.land, p.rarity, { from: user1 });
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      p.edition = 0;
      p.land = 99;
      try {
        await BankInstance.buyProp(p.edition, p.land, p.rarity, {
          from: user1,
        });
      } catch (err) {
        assert(utils.isEVMException(err), err.toString());
        p.land = 1;
        p.rarity = 5;
        try {
          await BankInstance.buyProp(p.edition, p.land, p.rarity, {
            from: user1,
          });
        } catch (err) {
          assert(utils.isEVMException(err), err.toString());
          return;
        }
        assert(false, "test did not revert");
      }
      assert(false, "test did not revert");
    }
    assert(false, "test did not revert");
  });

  it("user 1 to BUY PROP(0,1,2)", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    await BankInstance.setPriceOfProp(
      p.edition,
      p.land,
      p.rarity,
      web3.utils.toWei("100", "ether")
    );

    let price = await BankInstance.getPriceOfProp(p.edition, p.land, p.rarity, {
      from: user1,
    });

    await MonoInstance.approve(BankInstance.address, price, { from: user1 });
    let result = await BankInstance.buyProp(p.edition, p.land, p.rarity, {
      from: user1,
    });

    let prop_id = result.logs[0].args["prop_id"];
    expect(await PropInstance.ownerOf(prop_id.toString())).to.equal(user1);
    expect((await PropInstance.balanceOf(user1)).toNumber()).to.equal(1);
  });

  it("should fail when buying too expensive prop", async function () {
    let p = {
      edition: 0,
      land: 39,
      rarity: 0,
    };
    let price = web3.utils.toWei("10000", "ether");
    await BankInstance.setPriceOfProp(p.edition, p.land, p.rarity, price);

    await MonoInstance.approve(BankInstance.address, price, { from: user1 });

    try {
      await BankInstance.buyProp(p.edition, p.land, p.rarity, { from: user1 });
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");
  });

  it("should mint 10 Builds (0, 1, 0) to user 1", async function () {
    let b = {
      edition: 0,
      land: 1,
      type: 0,
    };

    let price = web3.utils.toWei("10", "ether");
    await BankInstance.setPriceOfBuild(b.edition, b.land, b.type, price);

    let value = (
      await BankInstance.getPriceOfBuild(b.edition, b.land, b.type, {
        from: user1,
      })
    ).mul(web3.utils.toBN(10));

    await MonoInstance.approve(BankInstance.address, value, { from: user1 });

    let result = await BankInstance.buyBuild(b.edition, b.land, b.type, 10, {
      from: user1,
    });

    let id = result.logs[0].args["build_id"];
    expect((await BuildInstance.balanceOf(user1, id)).toNumber()).to.equal(10);
  });

  /*it("user shall be able to resell to the bank an owned PROP", async function () {
    let p = {
      edition: 0,
      land: 1,
      rarity: 2,
    };

    let user1mono = mono.connect(user1);
    let user1bank = bank.connect(user1);
    let user1prop = prop.connect(user1);

    let price = await user1bank.getPriceOfProp(p.edition, p.land, p.rarity);
    await user1mono.approve(bank.address, price);
    let tx = await user1bank.buyProp(p.edition, p.land, p.rarity);
    let tr = await tx.wait();
    let events = tr.events;
    if (events && events[3] && events[3].args) {
      let prop_id = events[3].args.prop_id;
      await user1prop.approve(bank.address, prop_id);
      tx = await user1bank.sellProp(prop_id);
      tr = await tx.wait();
      events = tr.events;
      if (events && events[3] && events[3].args) {
        expect(events[3].args.prop_id).to.equal(prop_id);
      } else {
        assert(false, "test fails");
      }
    } else {
      assert(false, "test fails");
    }
  });*/
});
