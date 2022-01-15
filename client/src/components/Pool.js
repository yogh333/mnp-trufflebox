import { useEffect, useRef, useState } from "react";

import { Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";

import { ethers } from "ethers";
import ERC20Json from "../contracts/ERC20.json";
import AggregatorV3InterfaceJson from "../contracts/AggregatorV3Interface.json";

function Pool(props) {
  const provider = props.provider;
  const address = props.address;
  const Staking = props.Staking;

  const rewardTokenName = props.reward_token_name;
  const rewardTokenSymbol = props.reward_token_symbol;
  const rewardTokenIcon = props.reward_token_icon;
  const rewardTokenAddress = props.reward_token_address;
  const rewardTokenPriceFeed = props.reward_token_price_feed;
  const rewardTokenBalance = props.reward_token_balance;

  const poolTokenAddress = props.pool_token_address;

  const [poolBalance, setPoolBalance] = useState(0);
  const [userStakeAmount, setUserStakeAmount] = useState(0);
  const [userPendingRewards, setUserPendingRewards] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [rewardTokenPrice, setRewardTokenPrice] = useState(
    props.reward_token_price
  );

  const [poolTokenName, setPoolTokenName] = useState(null);
  const [poolTokenSymbol, setPoolTokenSymbol] = useState(null);
  const [poolTokenIcon, setPoolTokenIcon] = useState(null);
  const [poolTokenDecimals, setPoolTokenDecimals] = useState(null);
  const [poolTokenYield, setPoolTokenYield] = useState(null);
  const [poolTokenIsTokenNetworkPool, setPoolTokenIsTokenNetworkPool] =
    useState(null);
  const [poolTokenPriceFeed, setPoolTokenPriceFeed] = useState(null);
  const [poolTokenPrice, setPoolTokenPrice] = useState(null);
  const [PoolTokenInstance, setPoolTokenInstance] = useState(null);
  const [PoolTokenPriceFeedInstance, setPoolTokenPriceFeedInstance] =
    useState(null);
  const [networkTokenVirtualAddress, setNetworkTokenVirtualAddress] =
    useState(null);

  const [isStakeModalShown, setIsStakeModalShown] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);

  const amountToStakeInput = useRef(null);

  const user = {
    account: props.address,
    rewardTokenBalance: rewardTokenBalance,
  };
  const aggregatorV3InterfaceABI = AggregatorV3InterfaceJson.abi;

  // functions
  const updateRewardTokenBalance = props.updateRewardTokenBalance; // .bind(this) si on a besoin du contexte de Pool

  useEffect(() => {
    if (!Staking || !poolTokenAddress) {
      return;
    }

    Staking.pools(poolTokenAddress).then((_pool) => {
      setPoolTokenYield(parseInt(_pool.yield));
      setPoolTokenIsTokenNetworkPool(_pool.isTokenNetwork);
    });

    setPoolTokenInstance(
      new ethers.Contract(
        poolTokenAddress,
        ERC20Json.abi,
        provider.getSigner(address)
      )
    );

    Staking.NETWORK_TOKEN_VIRTUAL_ADDRESS().then((_address) => {
      setNetworkTokenVirtualAddress(_address);
    });
  }, [Staking, poolTokenAddress]);

  useEffect(() => {
    if (
      !Staking ||
      !poolTokenAddress ||
      !PoolTokenInstance ||
      !networkTokenVirtualAddress ||
      poolTokenIsTokenNetworkPool === null
    ) {
      return;
    }

    if (poolTokenIsTokenNetworkPool) {
      Staking.networkTokenSymbol().then((_symbol) => {
        setPoolTokenSymbol(_symbol);
        setPoolTokenName("Network Token");
        setPoolTokenDecimals(18);
        setPoolTokenIcon("./images/tokens/" + _symbol.toLowerCase() + ".svg");
      });

      Staking.pools(networkTokenVirtualAddress).then((_pool) =>
        setPoolTokenPriceFeed(_pool.priceFeed)
      );

      return;
    }

    PoolTokenInstance.symbol().then((_symbol) => {
      setPoolTokenSymbol(_symbol);
      setPoolTokenIcon("./images/tokens/" + _symbol.toLowerCase() + ".svg");
    });
    PoolTokenInstance.name().then((_name) => setPoolTokenName(_name));
    PoolTokenInstance.decimals().then((_decimals) =>
      setPoolTokenDecimals(_decimals)
    );

    Staking.pools(poolTokenAddress).then((_pool) =>
      setPoolTokenPriceFeed(_pool.priceFeed)
    );
  }, [
    Staking,
    poolTokenAddress,
    PoolTokenInstance,
    networkTokenVirtualAddress,
    poolTokenIsTokenNetworkPool,
  ]);

  useEffect(() => {
    if (!Staking || !poolTokenPriceFeed) {
      return;
    }

    const _PoolTokenPriceFeedInstance = new ethers.Contract(
      poolTokenPriceFeed,
      aggregatorV3InterfaceABI,
      provider
    );

    setPoolTokenPriceFeedInstance(_PoolTokenPriceFeedInstance);
  }, [Staking, poolTokenPriceFeed]);

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

    if (props.poolToUpdateToken !== props.pool_token_address) {
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
    Staking.getPoolBalance(
      poolTokenIsTokenNetworkPool
        ? networkTokenVirtualAddress
        : poolTokenAddress
    ).then((balance) => {
      setPoolBalance(Number(ethers.utils.formatEther(balance)).toFixed(2));
    });
  };

  const updateUserBalanceInPool = () => {
    Staking.getUserBalanceInPool(poolTokenAddress, user.account).then(
      (balance) => {
        setUserStakeAmount(Number(ethers.utils.formatEther(balance)));
      }
    );
  };

  const updateUserPendingRewards = () => {
    Staking.pendingReward(poolTokenAddress).then((balance) => {
      setUserPendingRewards(Number(ethers.utils.formatEther(balance)));
    });
  };

  const updatePoolTokenUserBalance = () => {
    if (poolTokenIsTokenNetworkPool) {
      provider.getBalance(user.account).then((balance) => {
        setUserBalance(Number(ethers.utils.formatEther(balance)));
      });

      return;
    }

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

    if (poolTokenIsTokenNetworkPool) {
      Staking.stake(
        poolTokenAddress,
        ethers.utils.parseEther(amountToStake.toString()),
        { value: ethers.utils.parseEther(amountToStake.toString()) }
      ).then((result) => {
        setIsPerforming(false);
        setIsStakeModalShown(false);
      });

      return;
    }

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
      poolTokenAddress,
      ethers.utils.parseEther(amountToStake.toString())
    ).then((result) => {
      setIsPerforming(false);
      setIsStakeModalShown(false);
    });
  };

  const doUnstake = async () => {
    Staking.unstake(poolTokenAddress).then((result) => {
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
          stake <span className="symbol">{poolTokenSymbol}</span>
          <img
            className="token"
            alt={poolTokenName}
            title={poolTokenName}
            src={poolTokenIcon}
          />
          earn <span className="symbol">{rewardTokenSymbol}</span>
          <img
            className="token"
            alt={rewardTokenName}
            title={rewardTokenName}
            src={rewardTokenIcon}
          />
          <br />
          APR: {poolTokenYield} %
        </Card.Header>
        <Card.Body>
          <Row>
            <div className="title">{rewardTokenSymbol} earned</div>
          </Row>
          <Row>
            <Col>{userPendingRewards.toFixed(6)}</Col>
            <Col className="right">
              {(userPendingRewards * rewardTokenPrice).toFixed(6)} $
            </Col>
          </Row>
          <Row>
            <div className="title">{poolTokenSymbol} stacked</div>
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
                "Stake " + poolTokenSymbol
              ) : (
                "Unstake " + poolTokenSymbol
              )}
            </Button>
          </Row>
        </Card.Footer>
      </Card>

      <Modal show={isStakeModalShown} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>{poolTokenSymbol} staking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              My {poolTokenSymbol} balance: {userBalance}
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
              "Stake " + poolTokenSymbol
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
