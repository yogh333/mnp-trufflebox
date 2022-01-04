import { useState, useEffect } from "react";

import StakingJson from "../contracts/Staking.json";
import ERC20Json from "../contracts/ERC20.json";

import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Spinner } from "react-bootstrap";

import Pool from "./Pool";
import { ethers } from "ethers";

import "../css/Staking.css";

function Staking(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Staking, setStaking] = useState(null);
  const [RewardTokenPriceFeedInstance, setRewardTokenPriceFeedInstance] =
    useState(null);
  const [RewardTokenInstance, setRewardTokenInstance] = useState(null);
  const [startBlockNumber, setStartBlockNumber] = useState(null);
  const [poolsAddresses, setPoolsAddresses] = useState([]);
  const [rewardTokenPrice, setRewardTokenPrice] = useState(null);
  const [rewardTokenBalance, setRewardTokenBalance] = useState(0);
  const [rewardToken, setRewardToken] = useState({
    address: null,
    name: null,
    symbol: null,
    decimals: null,
    icon: "",
  });
  const [poolToUpdateToken, setPoolToUpdateToken] = useState(null);

  useEffect(async () => {
    if (!(provider && address && networkId)) {
      return;
    }

    const _Staking = new ethers.Contract(
      StakingJson.networks[networkId].address,
      StakingJson.abi,
      provider.getSigner(address)
    );

    const _startBlockNumber = await provider.getBlockNumber();

    setStaking(_Staking);
    setStartBlockNumber(_startBlockNumber);
  }, [provider, address, networkId]);

  useEffect(async () => {
    if (!Staking) {
      return;
    }

    const rewardTokenAddress = await Staking.rewardToken();

    const aggregatorV3InterfaceABI = [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "description",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
        name: "getRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "version",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];
    const rewardTokenPriceFeed = await retrievePoolPriceFeed(
      rewardTokenAddress
    );
    const _RewardTokenPriceFeedInstance = new ethers.Contract(
      rewardTokenPriceFeed,
      aggregatorV3InterfaceABI,
      provider.getSigner()
    );

    const _RewardTokenInstance = new ethers.Contract(
      rewardTokenAddress,
      ERC20Json.abi,
      provider.getSigner()
    );

    const rewardTokenName = await _RewardTokenInstance.name();
    const rewardTokenSymbol = await _RewardTokenInstance.symbol();
    const rewardTokenDecimals = await _RewardTokenInstance.decimals();

    rewardToken.address = rewardTokenAddress;
    rewardToken.name = rewardTokenName;
    rewardToken.symbol = rewardTokenSymbol;
    rewardToken.decimals = rewardTokenDecimals;
    rewardToken.icon =
      "./images/tokens/" + rewardTokenSymbol.toLowerCase() + ".svg";

    setRewardToken(rewardToken);

    setRewardTokenPriceFeedInstance(_RewardTokenPriceFeedInstance);
    setRewardTokenInstance(_RewardTokenInstance);
  }, [Staking]);

  useEffect(async () => {
    if (!RewardTokenInstance || !RewardTokenPriceFeedInstance || !rewardToken) {
      return;
    }

    updateValues();
  }, [RewardTokenInstance, RewardTokenPriceFeedInstance, rewardToken]);

  useEffect(async () => {
    if (
      !startBlockNumber ||
      !RewardTokenPriceFeedInstance ||
      !RewardTokenInstance
    ) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, RewardTokenPriceFeedInstance, RewardTokenInstance]);

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

  const updateValues = () => {
    updateRewardTokenPrice();
    updateRewardTokenBalance();
    updatePoolsAddresses();
  };

  const retrievePoolPriceFeed = async (poolTokenAddress) => {
    try {
      const pool = await Staking.pools(poolTokenAddress);

      return pool.priceFeed;
    } catch (error) {
      console.error(error);
    }
  };

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

  return (
    <>
      <Container>
        <div>
          {poolsAddresses.map((poolToken, index) => (
            <Pool
              provider={provider}
              address={address}
              Staking={Staking}
              updateRewardTokenBalance={updateRewardTokenBalance}
              retrievePoolPriceFeed={retrievePoolPriceFeed}
              id={index}
              key={index}
              poolToken={poolToken}
              rewardToken={rewardToken}
              rewardTokenPrice={rewardTokenPrice}
              rewardTokenBalance={rewardTokenBalance}
              poolToUpdateToken={poolToUpdateToken}
            />
          ))}
        </div>
      </Container>
    </>
  );
}

export default Staking;
