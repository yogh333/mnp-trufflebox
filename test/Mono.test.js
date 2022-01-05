const Mono = artifacts.require("MonoContract");
const truffleAssert = require("truffle-assertions");

const utils = require("./utils.js");

contract("MonoContract", async (accounts) => {
  var MonoInstance;
  var deployer;
  var user1;
  var user2;

  /* mint 1000 $MONO to every account  */
  var mint = async (accounts) => {
    for (let i = 0; i < accounts.length; i++) {
      await MonoInstance.mint(accounts[i], web3.utils.toWei("1000", "ether"));
    }
  };

  beforeEach(async function () {
    /* deploy $MONO ERC-20 with a max supply */
    let max_supply = web3.utils.toBN(accounts.length * 1000);
    MonoInstance = await Mono.new(web3.utils.toWei(max_supply, "ether"));
    deployer = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
  });

  it("should mint 1000 $MONO to every account", async function () {
    await mint(accounts);

    for (let i = 0; i < accounts.length; i++) {
      let balance = await MonoInstance.balanceOf(accounts[i]);
      expect(balance.toString()).to.equal(web3.utils.toWei("1000", "ether"));
    }
  });

  it("should revert when minting exceeds token max supply", async function () {
    await mint(accounts);

    await truffleAssert.reverts(
      MonoInstance.mint(user1, web3.utils.toWei("1000", "ether"))
    );

    /*try {
      await MonoInstance.mint(user1, web3.utils.toWei("1000", "ether"));
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");*/
  });

  it("should let user1 to burn 500 $MONO", async function () {
    await mint(accounts);

    await MonoInstance.burn(web3.utils.toWei("500", "ether"), { from: user1 });

    let balance = await MonoInstance.balanceOf(user1);

    expect(balance.toString()).to.equal(web3.utils.toWei("500", "ether"));
  });

  it("should let granted user to transfer 500 $MONO owned by another user", async function () {
    await mint(accounts);

    await MonoInstance.approve(user2, web3.utils.toWei("500", "ether"), {
      from: user1,
    });

    await MonoInstance.transferFrom(
      user1,
      user2,
      web3.utils.toWei("500", "ether"),
      { from: user2 }
    );

    let balance = await MonoInstance.balanceOf(user1);

    expect(balance.toString()).to.equal(web3.utils.toWei("500", "ether"));
  });

  it("should let granted user to burn 500 $MONO owned by another user", async function () {
    await mint(accounts);

    await MonoInstance.approve(deployer, web3.utils.toWei("500", "ether"), {
      from: user1,
    });
    await MonoInstance.burnFrom(user1, web3.utils.toWei("500", "ether"));

    expect((await MonoInstance.balanceOf(user1)).toString()).to.equal(
      web3.utils.toWei("500", "ether")
    );
  });

  it("minting token should not be possible after pausing", async function () {
    await MonoInstance.pause();

    await truffleAssert.reverts(
      MonoInstance.mint(user1, web3.utils.toWei("1000", "ether"))
    );

    /*try {
      await MonoInstance.mint(user1, web3.utils.toWei("1000", "ether"));
    } catch (err) {
      assert(utils.isEVMException(err), err.toString());
      return;
    }
    assert(false, "test did not revert");*/
  });

  it("minting token should be possible after unpausing", async function () {
    await MonoInstance.pause();
    await MonoInstance.unpause();
    await MonoInstance.mint(user1, web3.utils.toWei("1000", "ether"));

    expect((await MonoInstance.balanceOf(user1)).toString()).to.equal(
      web3.utils.toWei("1000", "ether")
    );
  });

  it("user1 to transfer 500 $MONO to user2", async function () {
    await mint(accounts);

    await MonoInstance.transfer(user2, web3.utils.toWei("500", "ether"), {
      from: user1,
    });

    expect((await MonoInstance.balanceOf(user1)).toString()).to.equal(
      web3.utils.toWei("500", "ether")
    );
    expect((await MonoInstance.balanceOf(user2)).toString()).to.equal(
      web3.utils.toWei("1500", "ether")
    );
  });
});
