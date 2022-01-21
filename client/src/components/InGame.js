import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Game.css";

import boards from "../data/boards.json";

import StakingJson from "../contracts/StakingContract.json";

import { Button, Card, Container, Spinner } from "react-bootstrap";

function InGame(props) {
  const IN_GAME_MONO_AMOUNT = 50;

  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;
  // Contracts
  const Staking = props.staking_contract;
  const Bank = props.bank_contract;
  const Mono = props.mono_contract;
  const Board = props.board_contract;
  const Pawn = props.pawn_contract;
  // vars
  const pawnID = props.pawn_id;
  const startBlockNumber = props.start_block_number;
  // functions
  const parentUpdateValues = props.parent_update_values_function;

  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const [inGameStep, setInGameStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  const [monoBalance, setMonoBalance] = useState(null);
  const [pawnBalance, setPawnBalance] = useState(ethers.utils.parseEther("0"));
  const [monoToBuy, setMonoToBuy] = useState(0);
  const [networkTokensToBuy, setNetworkTokensToBuy] = useState(null);

  useEffect(() => {
    return () => {
      unsubscribeContractsEvents();
    };
  }, []);

  useEffect(() => {
    if (!Mono || !Pawn || !Staking) return;

    updateValues();
    setIsReadyToRender(true);
  }, [Mono, Pawn, Staking]);

  useEffect(() => {
    if (!startBlockNumber || !Bank) {
      return;
    }

    subscribeContractsEvents();
    return () => {
      unsubscribeContractsEvents();
    };
  }, [startBlockNumber, Bank]);

  const unsubscribeContractsEvents = () => {
    window.removeEventListener("PlayerEnrolled", (edition, player, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      parentUpdateValues();
    });
    window.removeEventListener(
      "DicesRollsPrepaid",
      (player, quantity, event) => {
        if (event.blockNumber <= startBlockNumber) return;

        updateValues();
      }
    );
    window.removeEventListener("MonoBought", (player, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (player.toLowerCase() !== address) return;

      updateValues();
      parentUpdateValues();
    });
    window.removeEventListener("Approval", (owner, spender, value, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (owner.toLowerCase() !== address) return;

      updateValues();
    });
  };

  const subscribeContractsEvents = () => {
    Bank.on("PlayerEnrolled", (edition, player, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      parentUpdateValues();
    });
    Bank.on("DicesRollsPrepaid", (player, quantity, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      updateValues();
    });
    Bank.on("MonoBought", (player, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (player.toLowerCase() !== address) return;

      updateValues();
      parentUpdateValues();
    });
    Mono.on("Approval", (owner, spender, value, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (owner.toLowerCase() !== address) return;

      updateValues();
    });
  };

  const updateValues = () => {
    setIsPerforming(false);

    updatePlayerInfos();
  };

  const updatePlayerInfos = async () => {
    const _monoBalance = await Mono.balanceOf(address);
    const _pawnBalance = await Pawn.balanceOf(address);

    let _isRegistered, _pawnID;
    if (_pawnBalance.toNumber() > 0) {
      _pawnID = await Pawn.tokenOfOwnerByIndex(address, 0);
      _isRegistered = await Board.isRegistered(props.edition_id, _pawnID);
    }

    const _monoToBuy = Math.ceil(
      IN_GAME_MONO_AMOUNT -
        Number(ethers.utils.formatEther(_monoBalance)).toFixed(2) +
        (_pawnBalance.toNumber() > 0 ? 0 : 1)
    );

    const setData = (_step) => {
      setInGameStep(_step);
      setIsPerforming(false);
      setMonoBalance(_monoBalance);
      setPawnBalance(_pawnBalance);
      setIsRegistered(_isRegistered);
      setMonoToBuy(_monoToBuy);
    };

    const allowance = await Mono.allowance(address, Bank.address);

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1")) &&
      ethers.BigNumber.from(allowance).gte(ethers.utils.parseEther("1")) &&
      _pawnBalance.toNumber() > 0
    ) {
      setData(4);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(allowance).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (_pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      ) &&
      _pawnBalance.toNumber() > 0
    ) {
      setData(4);

      return;
    }

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1")) &&
      ethers.BigNumber.from(allowance).gte(ethers.utils.parseEther("1"))
    ) {
      setData(3);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(allowance).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (_pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      )
    ) {
      setData(3);

      return;
    }

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1"))
    ) {
      setData(2);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(
        ethers.utils.parseEther(_monoToBuy.toString())
      )
    ) {
      setData(2);

      return;
    }

    // Step 1
    const monoLastPrice = await Staking.getLastPrice(Mono.address);
    const networkTokenVirtualAddress =
      await Staking.NETWORK_TOKEN_VIRTUAL_ADDRESS();
    const networkTokenLastPrice = await Staking.getLastPrice(
      networkTokenVirtualAddress
    );

    setNetworkTokensToBuy(
      Math.ceil(
        ethers.utils
          .parseEther(_monoToBuy.toString())
          .mul(ethers.BigNumber.from(monoLastPrice))
          .div(ethers.BigNumber.from(networkTokenLastPrice))
      )
    );
    setData(1);
  };

  const buyMono = async () => {
    if (networkTokensToBuy === 0) {
      return;
    }

    setIsPerforming(true);

    try {
      const result = await Bank.buyMono({
        value: ethers.BigNumber.from(networkTokensToBuy.toString()),
      });
      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  const approveSpent = async () => {
    if (!props.edition_id) {
      return;
    }

    setIsPerforming(true);

    let result;

    try {
      result = await Mono.allowance(address, Bank.address);
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }

    if (
      ethers.BigNumber.from(result).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      )
    ) {
      updateValues();
      return;
    }

    try {
      result = await Mono.approve(
        Bank.address,
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      );

      setIsPerforming(false);
      if (!result) {
        return;
      }

      // Not waiting for Approve event
      updateValues();
    } catch (error) {
      console.error(error);
      return;
    }
  };

  const buyOnePawn = async () => {
    setIsPerforming(true);

    let result;

    try {
      result = await Bank.buyPawn();
      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  const enrollPlayer = async () => {
    if (!props.edition_id) {
      return;
    }

    setIsPerforming(true);

    let result;
    try {
      result = await Bank.enrollPlayer(props.edition_id);

      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  if (!isReadyToRender) {
    return <>{spinner}</>;
  }

  return (
    <Container>
      <div className={"d-flex justify-content-center"}>
        <Card
          className={inGameStep === 1 ? "m-1" : "d-none"}
          style={{ width: "calc((100% - 2rem)/3)" }}
        >
          <Card.Header className="text-center">
            Buy $MONO{isRegistered ? "" : " (in game step 1/4)"}
          </Card.Header>
          <Card.Body>
            Before playing, you must buy {monoToBuy.toString()} $MONO.
          </Card.Body>
          <Card.Footer>
            <Button variant="primary" onClick={buyMono}>
              {isPerforming ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Buy"
              )}
            </Button>
          </Card.Footer>
        </Card>

        <Card
          className={inGameStep === 2 ? "m-1" : "d-none"}
          style={{ width: "calc((100% - 2rem)/3)" }}
        >
          <Card.Header className="text-center">
            Give allowance{!isRegistered ? " (in game step 2/4)" : ""}
          </Card.Header>
          <Card.Body>
            You must give us allowance to spent{" "}
            {(
              IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
            ).toString()}{" "}
            $MONO
          </Card.Body>
          <Card.Footer>
            <Button variant="primary" onClick={approveSpent}>
              {isPerforming ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Approve"
              )}
            </Button>
          </Card.Footer>
        </Card>

        <Card
          className={inGameStep === 3 ? "m-1" : "d-none"}
          style={{ width: "calc((100% - 2rem)/3)" }}
        >
          <Card.Header className="text-center">
            Buy a pawn{!isRegistered ? " (in game step 3/4)" : ""}
          </Card.Header>
          <Card.Body>You don't have a pawn. Buy one.</Card.Body>
          <Card.Footer>
            <Button variant="primary" onClick={buyOnePawn}>
              {isPerforming ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Buy"
              )}
            </Button>
          </Card.Footer>
        </Card>

        <Card
          className={inGameStep === 4 ? "m-1" : "d-none"}
          style={{ width: "calc((100% - 2rem)/3)" }}
        >
          <Card.Header className="text-center">
            Enroll{!isRegistered ? " (in game step 4/4)" : ""}
          </Card.Header>
          <Card.Body>Last step, inscription to the board.</Card.Body>
          <Card.Footer>
            <Button variant="primary" onClick={enrollPlayer}>
              {isPerforming ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                "Go"
              )}
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </Container>
  );
}

export default InGame;
