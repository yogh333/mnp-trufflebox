const Pawn = artifacts.require("PawnContract");
const Board = artifacts.require("BoardMock");
const Prop = artifacts.require("PropContract");
const Bank = artifacts.require("BankContract");
const Mono = artifacts.require("MonoContract");
const Staking = artifacts.require("StakingContract");
const ERC20TokenStub = artifacts.require("ERC20TokenStub");
const MonoUsdPriceFeed = artifacts.require("MonoUsdPriceFeed");

const utils = require("./utils.js");
ethers = require("ethers");

contract("BankContract", async (accounts) => {
  beforeEach(async function () {
    let max_supply = web3.utils.toBN(accounts.length * 5000);
    MonoInstance = await Mono.new(web3.utils.toWei(max_supply, "ether"));

    /* mint 5000 $MONO to every account */
    for (let i = 0; i < accounts.length; i++) {
      await MonoInstance.mint(accounts[i], web3.utils.toWei("5000", "ether"));
    }

    /* Deploy Pawn */
    PawnInstance = await Pawn.new("NAME", "SYMBOL", "URI");

    /* Deploy Board */
    BoardInstance = await Board.new();

    /* Deploy Prop */
    PropInstance = await Prop.new(
      BoardInstance.address,
      "TMWPROP",
      "PROP",
      "https://token-cdn/"
    );

    LinkInstance = await ERC20TokenStub.new("Chainlink token", "LINK");

    MonoUsdPriceFeedInstance = await MonoUsdPriceFeed.new(0.01 * 10 ** 8);

    StakingInstance = await Staking.new(
      MonoInstance.address,
      MonoUsdPriceFeedInstance.address,
      "100", // yield
      "ETH" // network token symbol
    );

    /* Deploy Bank */
    BankInstance = await Bank.new(
      PawnInstance.address,
      BoardInstance.address,
      PropInstance.address,
      MonoInstance.address,
      LinkInstance.address,
      StakingInstance.address
    );

    /* grant MINTER_ROLE to Bank smartcontract */
    await PropInstance.grantRole(
      await PropInstance.MINTER_ROLE(),
      BankInstance.address
    );

    user1 = accounts[1];
    user2 = accounts[2];

    // Mint pawn to players
    await PawnInstance.mint(user1);

    // Register pawns
    const pawnID = await PawnInstance.tokenOfOwnerByIndex(user1, 0);
    await BoardInstance.register(0, pawnID, {
      from: accounts[0],
    });

    // set pawn info
    const _pawnInfo = {
      random: ethers.utils.parseEther("0"),
      position: "1",
      isOnBoard: true,
      isPropertyBought: false,
      isRentPaid: false,
      isRoundCompleted: false,
    };
    await BoardInstance.updatePawnInfo(0, pawnID, 2, _pawnInfo);
    /*await BankInstance.locatePlayer(0, { from: user1 }).then((info) => {
      console.log("locatePlayer", info);
    });

    await BoardInstance.getPawnInfo(0, pawnID).then((result) => {
      console.log("getPawn", result);
    });*/
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
      await BankInstance.buyProp(p.edition, { from: user1 });
      assert(false, "test must revert");
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
    }

    p.edition = 0;
    p.land = 99;
    try {
      await BankInstance.buyProp(p.edition, {
        from: user1,
      });
      assert(false, "test must revert");
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
    }

    p.land = 1;
    p.rarity = 5;
    try {
      await BankInstance.buyProp(p.edition, {
        from: user1,
      });
      assert(false, "test must revert");
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
    }
  });

  it("user 1 to BUY PROP(0)", async function () {
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
    let result = await BankInstance.buyProp(p.edition, {
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
      await BankInstance.buyProp(p.edition, { from: user1 });
      assert(false, "test must revert");
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
  });
});
