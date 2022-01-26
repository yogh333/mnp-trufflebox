// Staking.test.js

const Staking = artifacts.require("./StakingContract.sol");
const ChainLinkPriceFeed = artifacts.require("./ChainLinkPriceFeedStub.sol");
const ERC20Token = artifacts.require("./ERC20TokenStub.sol");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { BN } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Staking", async (accounts) => {
  const owner = accounts[0];
  const user = accounts[1];

  let StakingInstance;

  const rewardTokenSymbol = "DAI";

  const stakedAmount = 10 ** 19; // 10
  const stakedTime = 7; // in seconds

  let tokens = [];
  const addToken = (
    _name,
    _symbol,
    _instance,
    _tokenPriceFeedInstance,
    _yield
  ) => {
    tokens[_symbol] = {
      name: _name,
      symbol: _symbol,
      instance: _instance,
      priceFeedInstance: _tokenPriceFeedInstance,
      yield: _yield,
    };
  };

  const etherToWei = (ethers) => {
    return web3.utils.toWei(ethers.toString(), "ether");
  };

  const transfert = async (_symbol, _receiver, _amount) => {
    await tokens[_symbol].instance.mint(_receiver, _amount);
  };

  let lastStakeResult;
  const advanceBlockAtTime = (time) => {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: "2.0",
          method: "evm_mine",
          params: [time],
          id: 1337,
        },
        (err, _) => {
          if (err) {
            return reject(err);
          }
          const newBlockHash = web3.eth.getBlock("latest").hash;

          return resolve(newBlockHash);
        }
      );
    });
  };

  const newERC20TokenAndPriceFeed = async (_name, _symbol, _price, _yield) => {
    // _price: précision à 8 chiffres
    const _tokenInstance = await ERC20Token.new(_name, _symbol, {
      from: owner,
    });
    const _tokenPriceFeedInstance = await ChainLinkPriceFeed.new(
      _price * 10 ** 8,
      8
    );

    addToken(_name, _symbol, _tokenInstance, _tokenPriceFeedInstance, _yield);
  };

  const initialSetUp = async () => {
    await newERC20TokenAndPriceFeed("Dai Stablecoin", "DAI", 1, 100);

    StakingInstance = await Staking.new(
      // Deploy in truffle test env
      tokens[rewardTokenSymbol].instance.address,
      tokens[rewardTokenSymbol].priceFeedInstance.address,
      tokens[rewardTokenSymbol].yield,
      { from: owner }
    );

    await transfert(rewardTokenSymbol, StakingInstance.address, etherToWei(10));
  };

  before("SETUP", async () => {
    await initialSetUp();
  });
  describe("Initial State", () => {
    it("Users balances are corrects", async () => {
      let balance = await tokens[rewardTokenSymbol].instance.balanceOf(owner);
      assert.strictEqual(balance.toString(), etherToWei(100));
    });
    it("contract balance is correct", async () => {
      let balance = await tokens[rewardTokenSymbol].instance.balanceOf(
        StakingInstance.address
      );
      assert.strictEqual(balance.toString(), etherToWei(10));
    });
    it("No event 'PoolAdded' emitted", async () => {
      const result = await truffleAssert.createTransactionResult(
        StakingInstance,
        StakingInstance.transactionHash
      );
      truffleAssert.eventNotEmitted(result, "PoolAdded");
    });
    it("one pool registered", async () => {
      const poolsAddresses = await StakingInstance.getPools();
      assert.isArray(poolsAddresses);
      assert.include(
        poolsAddresses,
        tokens[rewardTokenSymbol].instance.address
      );
      assert.lengthOf(poolsAddresses, 1);
    });
    it("reward token pool is the good one", async () => {
      const token = await StakingInstance.rewardToken();
      assert.strictEqual(token, tokens[rewardTokenSymbol].instance.address);
    });
    it("registered pool is reward token pool", async () => {
      const pool = await StakingInstance.pools(
        tokens[rewardTokenSymbol].instance.address
      );

      assert.strictEqual(
        pool.info.token,
        tokens[rewardTokenSymbol].instance.address
      );
      assert.strictEqual(
        pool.info.yield,
        tokens[rewardTokenSymbol].yield.toString()
      );
      assert.strictEqual(
        pool.info.priceFeed,
        tokens[rewardTokenSymbol].priceFeedInstance.address
      );
    });
    it("last reward token price is 1", async () => {
      const lastPrice = await StakingInstance.getLastPrice(
        tokens[rewardTokenSymbol].instance.address
      );
      assert.strictEqual(lastPrice.toString(), new BN(10 ** 8).toString());
    });

    const tests = Array.from(Array(3).keys());
    tests.forEach((value) => {
      const _index = value;
      it(`user[${accounts[_index]}] balance in pool is zero`, async () => {
        const balance = await StakingInstance.getUserBalanceInPool(
          tokens[rewardTokenSymbol].instance.address,
          accounts[_index]
        );
        assert.strictEqual(balance.toString(), "0");
      });
    });
  });

  before("SETUP", async () => {
    await initialSetUp();
    await newERC20TokenAndPriceFeed("ChainLink Token", "LINK", 25.452, 200);
  });
  describe("#addPool()", () => {
    it("Should be called only by owner", async () => {
      await truffleAssert.reverts(
        StakingInstance.addPool(
          tokens["LINK"].instance.address,
          tokens["LINK"].priceFeedInstance.address,
          tokens["LINK"].yield,
          tokens["LINK"].symbol,
          tokens["LINK"].name,
          true,
          { from: user }
        )
      );
    });
    it("revert if already exists", async () => {
      await truffleAssert.reverts(
        StakingInstance.addPool(
          tokens[rewardTokenSymbol].instance.address,
          tokens[rewardTokenSymbol].priceFeedInstance.address,
          tokens[rewardTokenSymbol].yield,
          tokens[rewardTokenSymbol].symbol,
          tokens[rewardTokenSymbol].name,
          true,
          { from: owner }
        )
      );
    });
    it("new pool is added", async () => {
      await StakingInstance.addPool(
        tokens["LINK"].instance.address,
        tokens["LINK"].priceFeedInstance.address,
        tokens["LINK"].yield,
        tokens["LINK"].symbol,
        tokens["LINK"].name,
        true,
        { from: owner }
      );
      const poolsAddresses = await StakingInstance.getPools();
      assert.isArray(poolsAddresses);
      assert.include(
        poolsAddresses,
        tokens[rewardTokenSymbol].instance.address
      );
      assert.include(poolsAddresses, tokens["LINK"].instance.address);
      assert.lengthOf(poolsAddresses, 2);
    });
  });

  const approveAndStake = async (_tokenSymbol, _amount, _from) => {
    await tokens[_tokenSymbol].instance.approve(
      StakingInstance.address,
      etherToWei(_amount),
      { from: _from }
    );
    return StakingInstance.stake(
      tokens[_tokenSymbol].instance.address,
      etherToWei(_amount),
      { from: _from }
    );
  };

  before("SETUP", async () => {
    await initialSetUp();
  });
  describe("#stake()", () => {
    it("Non valid amount", async () => {
      await truffleAssert.reverts(
        StakingInstance.stake(tokens[rewardTokenSymbol].instance.address, 0, {
          from: owner,
        }),
        "Non valid amount"
      );
    });
    it("Must approve transaction before", async () => {
      await truffleAssert.reverts(
        StakingInstance.stake(
          tokens[rewardTokenSymbol].instance.address,
          etherToWei(10),
          { from: owner }
        )
      );
    });
    before("SETUP", async () => {
      await initialSetUp();
      await approveAndStake(rewardTokenSymbol, 10, owner);
    });
    it("new user pool balance expected", async () => {
      const balance = await StakingInstance.getUserBalanceInPool(
        tokens[rewardTokenSymbol].instance.address,
        owner
      );
      assert.strictEqual(balance.toString(), etherToWei(10));
    });
    before("SETUP", async () => {
      await initialSetUp();
      await approveAndStake(rewardTokenSymbol, 10, owner);
    });
    it("Must unstake before", async () => {
      await truffleAssert.reverts(
        StakingInstance.stake(
          tokens[rewardTokenSymbol].instance.address,
          etherToWei(10),
          { from: owner }
        ),
        "Unstack first"
      );
    });
  });

  const waitingBeforeUnstake = async (_time) => {
    const lastStakeBlock = await web3.eth.getBlock(
      lastStakeResult.receipt.blockNumber
    ); // Retrieve timestamp of the last stake
    await advanceBlockAtTime(lastStakeBlock.timestamp + _time);
  };

  describe("#pendingReward()", () => {
    before("SETUP", async () => {
      await initialSetUp();
      lastStakeResult = await approveAndStake(rewardTokenSymbol, 10, owner);
      await waitingBeforeUnstake(stakedTime);
    });
    it("Must have pending rewards", async () => {
      const pendingRewards = await StakingInstance.pendingReward(
        tokens[rewardTokenSymbol].instance.address,
        { from: owner }
      );
      assert.isTrue(pendingRewards.toNumber() > 0);
      assert.strictEqual(
        pendingRewards.toNumber(),
        Math.floor(
          (stakedAmount * stakedTime * tokens[rewardTokenSymbol].yield) /
            100 /
            365 /
            24 /
            60 /
            60
        )
      );
    });
  });

  describe("#Unstake()", () => {
    before("SETUP", async () => {
      await initialSetUp();
      lastStakeResult = await approveAndStake(rewardTokenSymbol, 10, owner);
      await waitingBeforeUnstake(stakedTime);
      await StakingInstance.unstake(
        tokens[rewardTokenSymbol].instance.address,
        { from: owner }
      );
    });
    it("new user pool balance expected", async () => {
      const balance = await StakingInstance.getUserBalanceInPool(
        tokens[rewardTokenSymbol].instance.address,
        owner
      );
      assert.strictEqual(balance.toString(), "0");
    });
    it("new user balance expected", async () => {
      const balance = await tokens[rewardTokenSymbol].instance.balanceOf(owner);
      assert.isTrue(balance.gt(new BN(etherToWei(10))));
      assert.isTrue(
        balance.sub(new BN(etherToWei(10))).toString() >=
          Math.floor(
            (stakedAmount * stakedTime * tokens[rewardTokenSymbol].yield) /
              100 /
              365 /
              24 /
              60 /
              60
          )
      );
    });
  });
});
