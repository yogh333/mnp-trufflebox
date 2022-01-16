import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Spinner from "react-bootstrap/Spinner";

import MonoJson from "../contracts/MonoContract.json";
import PropJson from "../contracts/PropContract.json";
import BoardJson from "../contracts/BoardContract.json";
import VRFCoordinatorJson from "../contracts/VRFCoordinatorContract.json";

import "../css/User.css";
import Button from "react-bootstrap/Button";

export default function User(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const address = props.address;
  const networkId = props.network_id;
  const maxCells = props.max_lands;
  const toggleUpdateValues = props.toggle_update_user_values;
  const Bank = props.bank_contract;
  const monoSymbol = props.mono_symbol;
  const isRoundCompleted = props.is_round_completed;

  // functions
  const retrieveLandInfo = props.retrieve_land_info;

  const [Mono, setMono] = useState(null);
  const [Prop, setProp] = useState(null);
  const [Board, setBoard] = useState(null);
  const [VRFCoordinator, setVRFCoordinator] = useState(null);
  const [balance, setBalance] = useState(spinner);
  const [propertyCount, setPropertyCount] = useState(spinner);
  const [rollDice, setRollDice] = useState(null);
  const [dicesResults, setDicesResults] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startBlockNumber, setStartBlockNumber] = useState(null);
  const [areDicesDisplayed, setAreDicesDisplayed] = useState(false);
  const [isShakerDisplayed, setIsShakerDisplayed] = useState(false);
  const [requestedID, setRequestedID] = useState(null);
  const [requestID, setRequestID] = useState(null);

  useEffect(() => {
    if (!(provider && address && networkId)) {
      return;
    }

    setMono(
      new ethers.Contract(
        MonoJson.networks[networkId].address,
        MonoJson.abi,
        provider
      )
    );

    setProp(
      new ethers.Contract(
        PropJson.networks[networkId].address,
        PropJson.abi,
        provider
      )
    );

    setBoard(
      new ethers.Contract(
        BoardJson.networks[networkId].address,
        BoardJson.abi,
        provider.getSigner()
      )
    );

    if (
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost"
    ) {
      setVRFCoordinator(
        new ethers.Contract(
          VRFCoordinatorJson.networks[networkId].address,
          VRFCoordinatorJson.abi,
          provider.getSigner()
        )
      );
    }

    provider
      .getBlockNumber()
      .then((_blockNumber) => setStartBlockNumber(_blockNumber));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, provider, networkId]);

  useEffect(() => {
    if (!Mono || !Prop) return;

    updateValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Mono, Prop]);

  const updateValues = () => {
    Mono.balanceOf(address).then((value) =>
      setBalance(ethers.utils.formatUnits(value))
    );
    Prop.balanceOf(address).then((value) => setPropertyCount(value.toNumber()));
  };

  useEffect(() => {
    if (toggleUpdateValues === null) {
      return;
    }

    updateValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleUpdateValues]);

  useEffect(() => {
    if (!Bank || !props.edition_id) {
      return;
    }

    Bank.locatePlayer(props.edition_id).then((_pawnInfo) => {
      setCurrentPosition(_pawnInfo.position);
      highlightCurrentCell(_pawnInfo.position);
      const rarity = getRandomRarity(_pawnInfo.random);
      retrieveLandInfo(_pawnInfo.position, rarity);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Bank, props.edition_id]);

  const getRandomRarity = (randomness) => {
    const number = getRandomInteger("rarity", 1, 111, randomness);
    // return rarity
    if (number <= 100) return 2;
    if (number <= 110) return 1;
    return 0;
  };

  const getRandomInteger = (type, min, max, randomNumber) => {
    // Simulate another random number from Chainlink VRF random number
    const modulo = max - min + 1;
    const value = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "string"],
      [ethers.BigNumber.from(randomNumber), type]
    );
    const number = ethers.BigNumber.from(ethers.utils.keccak256(value));

    return ethers.BigNumber.from(number).mod(modulo).toNumber() + min;
  };

  useEffect(() => {
    if (!startBlockNumber || !Board || !Bank) {
      return;
    }

    subscribeContractsEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startBlockNumber, Board, Bank]);

  useEffect(() => {
    if (!rollDice || !currentPosition) {
      return;
    }

    setAreDicesDisplayed(true);
    setIsShakerDisplayed(false); // todo lancer l'animation 3D
    handleNewPosition(currentPosition, rollDice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollDice]);

  const subscribeContractsEvents = () => {
    Bank.on("RollingDices", (_player, _edition, _requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      console.log("event", event);
      setIsShakerDisplayed(true);
      setAreDicesDisplayed(false);
      setRequestedID(_requestID);
    });
    Board.on("RandomReady", (_requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      console.log("event", event);
      setRequestID(_requestID);
    });
  };

  useEffect(() => {
    if (
      !(
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
      ) ||
      !requestedID ||
      !VRFCoordinator
    )
      return;

    VRFCoordinator.sendRandomness(requestedID).then(() => {
      console.log("VRFCoordinator response asked");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedID]);

  useEffect(() => {
    if (!requestID || !Bank || !requestedID || !props.edition_id) return;
    if (requestID !== requestedID) return;

    Bank.locatePlayer(props.edition_id).then((_pawnInfo) => {
      setRollDice(calculateDicesNumbers(_pawnInfo)); // to throw dices 3D animation and display dices results
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestID]);

  useEffect(() => {
    if (!rollDice) {
      return;
    }

    setAreDicesDisplayed(true);
    setIsShakerDisplayed(false); // todo lancer l'animation 3D
    handleNewPosition(currentPosition, rollDice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollDice]);

  /**
   * Calculate dices values [1;6]
   * @param pawnInfo
   * @return pawnInfo
   */
  const calculateDicesNumbers = (pawnInfo) => {
    const dicesSum =
      ethers.BigNumber.from(pawnInfo.random).mod(11).toNumber() + 2;
    console.log("dicesSum", dicesSum);
    const min = Math.min(6, dicesSum - 1);
    const max = Math.max(1, dicesSum - 6);
    const diceA = Math.floor(Math.random() * (min - max + 1)) + max;
    console.log("diceA", diceA);
    const diceB = dicesSum - diceA;
    console.log("diceB", diceB);

    return {
      random: pawnInfo.random,
      position: pawnInfo.position,
      dices: [diceA, diceB],
      dicesSum: dicesSum,
    };
  };

  /**
   * name: rollDices
   * description: simulates the roll of dice to move the game forward and to move on the pawn
   * random is retrieved with RandomReady(requestId) event
   */
  function rollDices() {
    if (!Bank || !props.edition_id) return;

    Bank.rollDices(props.edition_id);
  }

  /**
   * name: handleNewPosition
   * description: make all the operations to determine and to display the new position of the future pawn
   * @param previousPosition
   * @param pawnInfo
   */
  function handleNewPosition(previousPosition, pawnInfo) {
    const newCell = (previousPosition + pawnInfo.dicesSum) % maxCells;

    // todo STOPPER animation roll dices sur le front et lancer l'animation 3D puis à la fin :

    highlightCurrentCell(newCell);
    const rarity = getRandomRarity(pawnInfo.random);
    retrieveLandInfo(pawnInfo.position, rarity);
    setCurrentPosition(newCell);
    forgetPreviousPosition(previousPosition);
  }

  /**
   * name: forgetPreviousPosition
   * description: allows to remove the highlighting of the cell of the previous sum of the dice
   * @param previousPosition
   */
  function forgetPreviousPosition(previousPosition) {
    document
      .getElementById(`cell-${previousPosition}`)
      .classList.remove("active");
  }

  /**
   * name: highlightCurrentCell
   * description: highlight the cell which is the result of the sum of the dice
   * @param total
   */
  function highlightCurrentCell(total) {
    const activeCell = document.getElementById(`cell-${total}`);
    activeCell.classList.add("active");
  }

  return (
    <div>
      <div className="price">
        {balance}
        {monoSymbol}
      </div>
      <div>{propertyCount} NFT</div>

      <Button
        type="submit"
        variant="danger"
        size="sm"
        className="btn btn-primary btn-lg btn-block"
        onClick={rollDices}
        disabled={isRoundCompleted}
      >
        Roll the dice!
      </Button>

      <div
        id="dices_shaker"
        className={isShakerDisplayed ? "d-block" : "d-none"}
      >
        <div className="m-3">
          <img
            style={{ height: "10rem", aspectRatio: "1" }}
            src={require("../assets/dices_shaker.gif").default}
            alt="dices shaker"
          />
          <p>Waiting for randomness...</p>
        </div>
      </div>

      <div id="dices" className={areDicesDisplayed ? "d-block" : "d-none"}>
        <div className="mt-3 ml-150">
          {/* first dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dice_face_${
                rollDice ? rollDice.dices[0] : 1
              }.png`).default
            }
            alt="dice display"
          />
          {/* second dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dice_face_${
                rollDice ? rollDice.dices[1] : 1
              }.png`).default
            }
            alt="dice display"
          />
        </div>
      </div>
    </div>
  );
}
