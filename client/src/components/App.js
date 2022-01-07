import React, { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import Admin from "./Admin";
import Game from "./Game";
import Home from "./Home";
import Staker from "./Staker";

import "../css/App.css";
import { ethers } from "ethers";
import StakingJson from "../contracts/StakingContract.json";
import AggregatorV3InterfaceJson from "../contracts/AggregatorV3Interface.json";
import ERC20Json from "../contracts/ERC20.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [address, setAddress] = useState(null);

  const [Staking, setStaking] = useState(null);

  const [rewardTokenAddress, setRewardTokenAddress] = useState(null);
  const [rewardTokenName, setRewardTokenName] = useState(null);
  const [rewardTokenSymbol, setRewardTokenSymbol] = useState(null);
  const [rewardTokenIcon, setRewardTokenIcon] = useState(null);
  const [rewardTokenPriceFeed, setRewardTokenPriceFeed] = useState(null);
  const [rewardTokenPrice, setRewardTokenPrice] = useState(null);

  const [isRewardTokenDisplay, setIsRewardTokenDisplay] = useState(false);

  const aggregatorV3InterfaceABI = AggregatorV3InterfaceJson.abi;

  function initialize() {
    window.ethereum
      .request({ method: "net_version" })
      .then((value) => setNetworkId(value))
      .catch((err) => {
        console.error(err);
      });

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(handleAccountsChanged)
      .catch((err) => {
        console.error(err);
      });
  }

  function subscribeEthereumEvents() {
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }

  function handleChainChanged() {
    window.location.reload();
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      console.log("Please connect to MetaMask.");

      if (window.location.pathname !== "/") {
        // Redirection to Home when disconnected from all pages except home
        window.location.href = "/";
      }
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
    }
  }

  function getProvider() {
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  useEffect(() => {
    initialize();
    subscribeEthereumEvents();
    if (window.ethereum && !address) {
      setAddress(address);
    }

    setProvider(getProvider());
  }, []);

  useEffect(() => {
    setProvider(getProvider());
  }, [networkId, address]);

  function connectWallet() {
    if (address) {
      return;
    }

    if (typeof window.ethereum !== "undefined") {
      if (window.ethereum.isMetaMask) {
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then(handleAccountsChanged)
          .catch((err) => {
            if (err.code === 4001) {
              // EIP-1193 userRejectedRequest error
              // If this happens, the user rejected the connection request.
              console.log("Please connect to MetaMask.");
            } else {
              console.error(err);
            }
          });
      }
    }
  }

  useEffect(() => {
    if (!(provider && address && networkId)) {
      return;
    }

    setStaking(
      new ethers.Contract(
        StakingJson.networks[networkId].address,
        StakingJson.abi,
        provider.getSigner(address)
      )
    );
  }, [provider, address, networkId]);

  useEffect(() => {
    if (!Staking) {
      return;
    }

    Staking.rewardToken().then((_address) => setRewardTokenAddress(_address));
  }, [Staking]);

  useEffect(() => {
    if (!Staking || !rewardTokenAddress) {
      return;
    }

    Staking.pools(rewardTokenAddress).then((_pool) =>
      setRewardTokenPriceFeed(_pool.priceFeed)
    );
  }, [Staking, rewardTokenAddress]);

  useEffect(() => {
    if (!Staking || !rewardTokenAddress || !rewardTokenPriceFeed) {
      return;
    }

    const RewardTokenInstance = new ethers.Contract(
      rewardTokenAddress,
      ERC20Json.abi,
      provider.getSigner()
    );

    RewardTokenInstance.name().then((_name) => setRewardTokenName(_name));
    RewardTokenInstance.symbol().then((_symbol) => {
      setRewardTokenSymbol(_symbol);
      setRewardTokenIcon("/images/tokens/" + _symbol.toLowerCase() + ".svg");
    });
    RewardTokenInstance.decimals().then((_decimals) =>
      setRewardTokenName(_decimals)
    );
  }, [Staking, rewardTokenAddress, rewardTokenPriceFeed]);

  useEffect(() => {
    if (
      !Staking ||
      !rewardTokenAddress ||
      !rewardTokenPriceFeed ||
      !rewardTokenName ||
      !rewardTokenSymbol ||
      !rewardTokenIcon
    ) {
      return;
    }

    const RewardTokenPriceFeedInstance = new ethers.Contract(
      rewardTokenPriceFeed,
      aggregatorV3InterfaceABI,
      provider.getSigner()
    );

    RewardTokenPriceFeedInstance.latestRoundData().then((roundData) => {
      setRewardTokenPrice(
        ethers.utils.formatEther(roundData.answer + "0000000000")
      );
    });

    setIsRewardTokenDisplay(true);
  }, [
    Staking,
    rewardTokenAddress,
    rewardTokenPriceFeed,
    rewardTokenName,
    rewardTokenSymbol,
    rewardTokenIcon,
  ]);

  function renderOthersLinks() {
    if (!address) {
      return null;
    }

    return (
      <>
        <Nav.Link href="/game">Game</Nav.Link>
        <Nav.Link href="/staking">Staking</Nav.Link>
      </>
    );
  }

  const ellipsis = (string) => {
    return string.substring(0, 5) + "..." + string.slice(-3);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar className="px-3" bg="light">
          <Container>
            <Navbar.Brand className="brand">MNP World</Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link href="/">Home</Nav.Link>
              {renderOthersLinks()}
            </Nav>
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>
                <div
                  id="tokenRewardDisplay"
                  className={isRewardTokenDisplay ? "d-inline-block" : "d-none"}
                >
                  <img
                    className="token"
                    alt={rewardTokenName}
                    title={rewardTokenName}
                    src={rewardTokenIcon}
                  />{" "}
                  <span className="symbol">{rewardTokenSymbol}</span>{" "}
                  {rewardTokenPrice} $
                </div>
                <Button
                  className="mx-3"
                  variant="outline-primary"
                  onClick={connectWallet}
                >
                  {address ? ellipsis(address) : "Connect"}
                </Button>
              </Navbar.Text>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Routes>
          <Route
            exact
            path="/"
            element={
              <Home
                provider={provider}
                network_id={networkId}
                address={address}
              />
            }
          />
          <Route
            exact
            path="/admin/"
            element={
              <Admin
                provider={provider}
                network_id={networkId}
                address={address}
              />
            }
          />
          <Route
            exact
            path="/game"
            element={
              <Game
                provider={provider}
                network_id={networkId}
                address={address}
                edition_id="0"
              />
            }
          />
          <Route
            exact
            path="/staking"
            element={
              <Staker
                provider={provider}
                network_id={networkId}
                address={address}
                reward_token_name={rewardTokenName}
                reward_token_symbol={rewardTokenSymbol}
                reward_token_icon={rewardTokenIcon}
                reward_token_address={rewardTokenAddress}
                reward_token_price={rewardTokenPrice}
                reward_token_price_feed={rewardTokenPriceFeed}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
