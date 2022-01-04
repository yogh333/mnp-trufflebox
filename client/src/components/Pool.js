import React, { Component, useEffect, useRef, useState } from "react";

import { Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

import { ethers } from "ethers";
import ERC20Json from "../contracts/ERC20.json";

function Pool(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const address = props.address;
  const Staking = props.Staking;

  const [pool, setPool] = useState({
    token: {
      address: props.poolToken,
      name: null,
      symbol: null,
      decimals: null,
      icon: null,
    },
    yield: 0,
  });
  const [rewardToken, setRewardToken] = useState({
    address: props.rewardToken.address,
    name: props.rewardToken.name,
    symbol: props.rewardToken.symbol,
    decimals: props.rewardToken.decimals,
    icon: "",
  });
  const [poolBalance, setPoolBalance] = useState(0);
  const [userStakeAmount, setUserStakeAmount] = useState(0);
  const [userPendingRewards, setUserPendingRewards] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [rewardTokenPrice, setRewardTokenPrice] = useState(
    props.rewardTokenPrice
  );
  const [poolTokenPrice, setPoolTokenPrice] = useState(props.rewardTokenPrice);
  const [PoolTokenInstance, setPoolTokenInstance] = useState(null);
  const [PoolTokenPriceFeedInstance, setPoolTokenPriceFeedInstance] =
    useState(null);

  const [isStakeModalShown, setIsStakeModalShown] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);

  const amountToStakeInput = useRef(null);

  const user = {
    account: props.address,
    rewardTokenBalance: props.rewardTokenBalance,
  };

  // functions
  const updateRewardTokenBalance = props.updateRewardTokenBalance; // .bind(this) si on a besoin du contexte de Pool
  const retrievePoolPriceFeed = props.retrievePoolPriceFeed; // Ici on a bien besoin du contexte de App, donc rien

  useEffect(async () => {
    if (!(props.rewardToken && props.rewardToken.symbol)) {
      return;
    }

    rewardToken.address = props.rewardToken.address;
    rewardToken.name = props.rewardToken.name;
    rewardToken.symbol = props.rewardToken.symbol;
    rewardToken.decimals = props.rewardToken.decimals;
    rewardToken.icon =
      "./images/tokens/" + props.rewardToken.symbol.toLowerCase() + ".svg";

    setRewardToken(rewardToken);
  }, [props.rewardToken.symbol]);

  useEffect(async () => {
    if (!Staking) {
      return;
    }

    const _pool = await Staking.pools(pool.token.address);
    pool.yield = parseInt(_pool.yield);

    const _PoolTokenInstance = new ethers.Contract(
      pool.token.address,
      ERC20Json.abi,
      provider.getSigner(address)
    );

    pool.token.symbol = await _PoolTokenInstance.symbol();
    pool.token.icon =
      "./images/tokens/" + pool.token.symbol.toLowerCase() + ".svg";
    pool.token.name = await _PoolTokenInstance.name();
    pool.token.decimals = await _PoolTokenInstance.decimals();

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

    const poolTokenPriceFeed = await retrievePoolPriceFeed(pool.token.address);

    const _PoolTokenPriceFeedInstance = new ethers.Contract(
      poolTokenPriceFeed,
      aggregatorV3InterfaceABI,
      provider
    );

    setPool(pool);
    setPoolTokenInstance(_PoolTokenInstance);
    setPoolTokenPriceFeedInstance(_PoolTokenPriceFeedInstance);
  }, [Staking]);

  useEffect(() => {
    if (!PoolTokenInstance || !PoolTokenPriceFeedInstance) {
      return;
    }

    updateValues();
  }, [PoolTokenInstance, PoolTokenPriceFeedInstance]);

  useEffect(() => {
    if (
      !props.poolToUpdateToken ||
      !PoolTokenInstance ||
      !PoolTokenPriceFeedInstance
    ) {
      return;
    }

    if (props.poolToUpdateToken !== props.poolToken) {
      return;
    }

    updateValues();
  }, [props.poolToUpdateToken, PoolTokenInstance, PoolTokenPriceFeedInstance]);

  const updateValues = () => {
    updatePoolTokenPrice();
    updatePoolBalance();
    updateUserBalanceInPool();
    updatePoolTokenUserBalance();
    updateUserPendingRewards();
  };

  const updatePoolTokenPrice = () => {
    PoolTokenPriceFeedInstance.latestRoundData().then((roundData) => {
      setPoolTokenPrice(
        ethers.utils.formatEther(roundData.answer + "0000000000")
      );
    });
  };

  const updatePoolBalance = () => {
    Staking.getPoolBalance(pool.token.address).then((balance) =>
      setPoolBalance(Number(ethers.utils.formatEther(balance)).toFixed(2))
    );
  };

  const updateUserBalanceInPool = () => {
    Staking.getUserBalanceInPool(pool.token.address, user.account).then(
      (balance) => {
        setUserStakeAmount(Number(ethers.utils.formatEther(balance)));
      }
    );
  };

  const updateUserPendingRewards = () => {
    Staking.pendingReward(pool.token.address).then((balance) => {
      setUserPendingRewards(Number(ethers.utils.formatEther(balance)));
    });
  };

  const updatePoolTokenUserBalance = () => {
    PoolTokenInstance.balanceOf(user.account).then((balance) => {
      setUserBalance(Number(ethers.utils.formatEther(balance)));
    });
  };

  const doStake = async () => {
    if (!PoolTokenInstance || !user.account) {
      return;
    }

    const amountToStake = amountToStakeInput.current.value;

    setIsPerforming(true);

    let result;
    try {
      result = await PoolTokenInstance.allowance(user.account, Staking.address);
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      setIsStakeModalShown(false);
      return;
    }

    if (
      ethers.BigNumber.from(result) <
      ethers.utils.parseEther(amountToStake.toString())
    ) {
      try {
        result = await PoolTokenInstance.approve(
          Staking.address,
          ethers.utils.parseEther(amountToStake.toString())
        );
        if (!result.hash) {
          setIsPerforming(false);
          setIsStakeModalShown(false);
          return;
        }
      } catch (error) {
        console.error(error);
        setIsPerforming(false);
        setIsStakeModalShown(false);
        return;
      }
    }

    Staking.stake(
      pool.token.address,
      ethers.utils.parseEther(amountToStake.toString())
    ).then((result) => {
      setIsPerforming(false);
      setIsStakeModalShown(false);
    });
  };

  const doUnstake = async () => {
    Staking.unstake(pool.token.address).then((result) => {
      setIsPerforming(false);
    });
  };

  return (
    <>
      <Card
        className="m-1 d-inline-flex"
        style={{ width: "calc((100% - 2rem)/4)" }}
      >
        <Card.Header className="text-center">
          stake <span className="symbol">{pool.token.symbol}</span>
          <img
            className="token"
            alt={pool.token.name}
            title={pool.token.name}
            src={pool.token.icon}
          />
          earn <span className="symbol">{rewardToken.symbol}</span>
          <img
            className="token"
            alt={rewardToken.name}
            title={rewardToken.name}
            src={rewardToken.icon}
          />
          <br />
          APR: {pool.yield} %
        </Card.Header>
        <Card.Body>
          <Row>
            <div className="title">{rewardToken.symbol} earned</div>
          </Row>
          <Row>
            <Col>{userPendingRewards.toFixed(6)}</Col>
            <Col className="right">
              {(userPendingRewards * rewardTokenPrice).toFixed(6)} $
            </Col>
          </Row>
          <Row>
            <div className="title">{pool.token.symbol} stacked</div>
          </Row>
          <Row>
            <Col>{userStakeAmount.toFixed(4)}</Col>
            <Col className="right">
              {(userStakeAmount * poolTokenPrice).toFixed(6)} $
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer>
          <Row>
            <Button
              variant="primary"
              onClick={
                userStakeAmount === 0
                  ? () => setIsStakeModalShown(true)
                  : doUnstake
              }
            >
              {isPerforming ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : userStakeAmount === 0 ? (
                "Stake " + pool.token.symbol
              ) : (
                "Unstake " + pool.token.symbol
              )}
            </Button>
          </Row>
        </Card.Footer>
      </Card>

      <Modal show={isStakeModalShown} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>{pool.token.symbol} staking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              My {pool.token.symbol} balance: {userBalance}
            </Form.Group>
            <Form.Group>
              <Form.Control
                type="text"
                id="amountToStake"
                ref={amountToStakeInput}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={doStake}>
            {isPerforming ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              "Stake " + pool.token.symbol
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsStakeModalShown(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Pool;
