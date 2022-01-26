import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/App.css";
import {
  Button,
  Container,
  Modal,
  Nav,
  Navbar,
  Spinner,
} from "react-bootstrap";

import Admin from "./Admin";
import Game from "./Game";
import Home from "./Home";
import Staker from "./Staker";

import StakingJson from "../contracts/StakingContract.json";
import AggregatorV3InterfaceJson from "../contracts/AggregatorV3Interface.json";
import ERC20Json from "../contracts/ERC20.json";

function App() {
  const MUMBAI_NETWORK_ID = "80001";
  const spinner = <Spinner as="span" animation="border" size="sm" />;

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
  const monoSymbol = (
    <img
      className="symbol"
      alt="$MONO"
      title="$MONO"
      src={require("../assets/mono-symbol.svg").default}
    />
  );
  const [startBlockNumber, setStartBlockNumber] = useState(null);

  const [isRewardTokenDisplay, setIsRewardTokenDisplay] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [isDoingModalAction, setIsDoingModalAction] = useState(false);
  const [modalHTML, setModalHTML] = useState({
    title: "",
    body: "",
    button: "",
    action: "",
  });
  const [doModalAction, setDoModalAction] = useState(null);
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isNavbarDisplayed, setIsNavbarDisplayed] = useState(true);
  const [balance, setBalance] = useState(null);

  const aggregatorV3InterfaceABI = AggregatorV3InterfaceJson.abi;

  function initialize() {
    window.ethereum
      .request({ method: "net_version" })
      .then((_networkID) => {
        if (_networkID !== MUMBAI_NETWORK_ID) {
          setIsReadyToRender(true);
          return;
        }
        setNetworkId(_networkID);
      })
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
      setIsReadyToRender(true);

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
    if (!networkId || networkId !== MUMBAI_NETWORK_ID || !address) return;

    setProvider(getProvider());
  }, [networkId, address]);

  function connectWallet() {
    if (address) return;

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
              setIsReadyToRender(true);
            } else {
              console.error(err);
            }
          });
      }
    }
  }

  useEffect(() => {
    if (!(provider && address && networkId)) return;

    setStaking(
      new ethers.Contract(
        StakingJson.networks[networkId].address,
        StakingJson.abi,
        provider.getSigner(address)
      )
    );

    provider.getBalance(address).then((_balance) => setBalance(_balance));

    provider
      .getBlockNumber()
      .then((_blockNumber) => setStartBlockNumber(_blockNumber));
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

    Staking.pools(rewardTokenAddress).then((_pool) => {
      setRewardTokenPriceFeed(_pool.info.priceFeed);
      setRewardTokenName(_pool.info.name);
      setRewardTokenSymbol(_pool.info.symbol);
      setRewardTokenIcon("/images/tokens/" + "mono" + ".png");
    });
  }, [Staking, rewardTokenAddress]);

  useEffect(() => {
    if (!Staking || !rewardTokenAddress || !rewardTokenPriceFeed) return;

    const RewardTokenInstance = new ethers.Contract(
      rewardTokenAddress,
      ERC20Json.abi,
      provider.getSigner()
    );
  }, [Staking, rewardTokenAddress, rewardTokenPriceFeed]);

  useEffect(() => {
    if (
      !Staking ||
      !rewardTokenAddress ||
      !rewardTokenPriceFeed ||
      !rewardTokenName ||
      !rewardTokenSymbol ||
      !rewardTokenIcon ||
      !startBlockNumber
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
    setIsReadyToRender(true);
  }, [
    Staking,
    rewardTokenAddress,
    rewardTokenPriceFeed,
    rewardTokenName,
    rewardTokenSymbol,
    rewardTokenIcon,
    startBlockNumber,
  ]);

  // reset modal data and diffuse to children
  useEffect(() => {
    if (!modalHTML) return;

    if (modalHTML.action === "") {
      setDoModalAction("");
    }
  }, [modalHTML]);

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

  if (!isReadyToRender) {
    return <>{spinner}</>;
  }

  if (networkId !== MUMBAI_NETWORK_ID) {
    return (
      <div>
        You must connect Metamask to mumbai network (polygon testnet) to play.
        You can easily add it to Metamask clicking link at the bottom of{" "}
        <a href="https://mumbai.polygonscan.com/#darkModaBtn">
          mumbai explorer page
        </a>
        .
      </div>
    );
  }

  if (balance && balance.lt(ethers.utils.parseEther("0.1"))) {
    return (
      <div>
        Your MATIC balance ({ethers.utils.formatEther(balance)}) is too low.
        Fill your account with MATIC for Mumbai network
        <a href="https://faucet.polygon.technology/"> here </a>.
      </div>
    );
  }

  return (
    <div className="App">
      <Modal show={isModalShown} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>
            <div dangerouslySetInnerHTML={{ __html: `${modalHTML.title}` }} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body id="Description__tooltip">
          <div dangerouslySetInnerHTML={{ __html: `${modalHTML.body}` }} />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setIsDoingModalAction(true);
              setDoModalAction(modalHTML.action);
            }}
          >
            {isDoingModalAction ? (
              spinner
            ) : (
              <span
                dangerouslySetInnerHTML={{ __html: `${modalHTML.button}` }}
              />
            )}
          </Button>
          <Button variant="secondary" onClick={() => setIsModalShown(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <BrowserRouter>
        <Navbar
          id="navbar"
          className={isNavbarDisplayed ? "d-block" : "d-none"}
          bg="light"
        >
          {" "}
          {window.location.pathname === "/game" ? (
            <div id="hide-navbar" className="mx-1 my-2">
              <Button
                variant="outline-dark"
                size="sm"
                className="hide secondary"
                onClick={() => {
                  setIsNavbarDisplayed(false);
                  document.querySelector("#user-info").style.marginTop =
                    "-2rem";
                }}
              >
                X
              </Button>
            </div>
          ) : (
            <></>
          )}
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
                mono_symbol={monoSymbol}
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
                mono_symbol={monoSymbol}
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
                staking_contract={Staking}
                spinner={spinner}
                mono_symbol={monoSymbol}
                set_is_modal_shown={setIsModalShown}
                set_modal_html={setModalHTML}
                do_modal_action={doModalAction}
                set_is_doing_modal_action={setIsDoingModalAction}
                start_block_number={startBlockNumber}
                is_navbar_displayed={isNavbarDisplayed}
                set_is_navbar_displayed={setIsNavbarDisplayed}
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
                staking_contract={Staking}
                reward_token_name={rewardTokenName}
                reward_token_symbol={rewardTokenSymbol}
                reward_token_icon={rewardTokenIcon}
                reward_token_address={rewardTokenAddress}
                reward_token_price={rewardTokenPrice}
                reward_token_price_feed={rewardTokenPriceFeed}
                mono_symbol={monoSymbol}
                start_block_number={startBlockNumber}
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
