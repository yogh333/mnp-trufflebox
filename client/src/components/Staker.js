import { useState, useEffect } from "react";

import ERC20Json from "../contracts/ERC20.json";

import "bootstrap/dist/css/bootstrap.min.css";
import { Container } from "react-bootstrap";

import Pool from "./Pool";
import { ethers } from "ethers";

import "../css/Staking.css";
import AggregatorV3InterfaceJson from "../contracts/AggregatorV3Interface.json";

function Staker(props) {
  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const Staking = props.staking_contract;
  const startBlockNumber = props.start_block_number;

  const rewardTokenName = props.reward_token_name;
  const rewardTokenSymbol = props.reward_token_symbol;
  const rewardTokenIcon = props.reward_token_icon;
  const rewardTokenAddress = props.reward_token_address;
  const rewardTokenPriceFeed = props.reward_token_price_feed;

  const [rewardTokenPrice, setRewardTokenPrice] = useState(
    props.reward_token_price
  );
  const [RewardTokenPriceFeedInstance, setRewardTokenPriceFeedInstance] =
    useState(null);
  const [RewardTokenInstance, setRewardTokenInstance] = useState(null);
  const [poolsAddresses, setPoolsAddresses] = useState([]);
  const [rewardTokenBalance, setRewardTokenBalance] = useState(0);

  const [poolToUpdateToken, setPoolToUpdateToken] = useState(null);

  const aggregatorV3InterfaceABI = AggregatorV3InterfaceJson.abi;

  useEffect(() => {
    if (
      !Staking ||
      !startBlockNumber ||
      !rewardTokenAddress ||
      !rewardTokenPriceFeed
    ) {
      return;
    }

    setRewardTokenPriceFeedInstance(
      new ethers.Contract(
        rewardTokenPriceFeed,
        aggregatorV3InterfaceABI,
        provider.getSigner()
      )
    );

    setRewardTokenInstance(
      new ethers.Contract(
        rewardTokenAddress,
        ERC20Json.abi,
        provider.getSigner()
      )
    );
  }, [Staking, startBlockNumber, rewardTokenPriceFeed, rewardTokenAddress]);

  const updateRewardTokenPrice = () => {
    RewardTokenPriceFeedInstance.latestRoundData().then((roundData) => {
      setRewardTokenPrice(
        ethers.utils.formatEther(roundData.answer + "0000000000")
      );
    });
  };

  const updateRewardTokenBalance = () => {
    RewardTokenInstance.balanceOf(address).then((balance) => {
      setRewardTokenBalance(Number(ethers.utils.formatEther(balance)));
    });
  };

  const updatePoolsAddresses = () => {
    Staking.getPools().then((poolsAddresses) => {
      setPoolsAddresses(poolsAddresses);
    });
  };

  const updateValues = () => {
    updateRewardTokenPrice();
    updateRewardTokenBalance();
    updatePoolsAddresses();
  };

  useEffect(() => {
    if (!Staking || !RewardTokenInstance || !RewardTokenPriceFeedInstance) {
      return;
    }

    updateValues();
  }, [Staking, RewardTokenInstance, RewardTokenPriceFeedInstance]);

  const subscribeContractsEvents = () => {
    Staking.on("PoolAdded", (user, tokenPoolAddress, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      setPoolToUpdateToken(null);
      updateValues();
    });
    Staking.on("Staked", (user, tokenPoolAddress, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      setPoolToUpdateToken(tokenPoolAddress);
      updateValues();
    });
    Staking.on("Unstaked", (user, tokenPoolAddress, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      setPoolToUpdateToken(tokenPoolAddress);
      updateValues();
    });
  };

  useEffect(() => {
    if (
      !Staking ||
      !startBlockNumber ||
      !RewardTokenPriceFeedInstance ||
      !RewardTokenInstance
    ) {
      return;
    }

    subscribeContractsEvents();
  }, [
    Staking,
    startBlockNumber,
    RewardTokenPriceFeedInstance,
    RewardTokenInstance,
  ]);

  return (
    <>
      <Container>
        <div>
          {poolsAddresses.map((poolTokenAddress, index) => (
            <Pool
              provider={provider}
              address={address}
              Staking={Staking}
              updateRewardTokenBalance={updateRewardTokenBalance}
              id={index}
              key={index}
              pool_token_address={poolTokenAddress}
              reward_token_name={rewardTokenName}
              reward_token_symbol={rewardTokenSymbol}
              reward_token_icon={rewardTokenIcon}
              reward_token_address={rewardTokenAddress}
              reward_token_price={rewardTokenPrice}
              reward_token_price_feed={rewardTokenPriceFeed}
              reward_token_balance={rewardTokenBalance}
              poolToUpdateToken={poolToUpdateToken}
            />
          ))}
        </div>
      </Container>
    </>
  );
}

export default Staker;
