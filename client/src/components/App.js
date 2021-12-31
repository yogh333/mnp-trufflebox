import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import Admin from "./Admin";
import Game from "./Game";
import Home from "./Home";

import "../css/App.css";
import { ethers } from "ethers";

function App() {
  const [provider, setProvider] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [address, setAddress] = useState(null);

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
              <Home
                provider={provider}
                network_id={networkId}
                address={address}
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
