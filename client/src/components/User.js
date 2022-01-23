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
  const DISTANT_NETWORKS_IDS = ["42", "80001"]; //['kovan', 'mumbai']

  const provider = props.provider;
  const address = props.address;
  const networkId = props.network_id;
  // Contracts
  const Bank = props.bank_contract;
  const Mono = props.mono_contract;
  const Board = props.board_contract;
  const Prop = props.prop_contract;
  // vars
  const monoSymbol = props.mono_symbol;
  const isRoundCompleted = props.is_round_completed;
  const pawnInfo = props.pawn_info;
  const pawnPosition = pawnInfo.position;
  const globalVars = props.global_vars;
  const startBlockNumber = props.start_block_number;
  const toggleUpdateValues = props.toggle_update_user_values;
  // functions
  const retrieveLandInfo = props.retrieve_land_info;
  const parentUpdateValues = props.parent_update_values_function;
  const setGlobalVars = props.set_global_vars;
  const setMustResetAlert = props.set_must_reset_alert;

  const [VRFCoordinator, setVRFCoordinator] = useState(null);
  const [balance, setBalance] = useState(spinner);
  const [propertyCount, setPropertyCount] = useState(spinner);
  const [rollDice, setRollDice] = useState(null);
  const [areDicesDisplayed, setAreDicesDisplayed] = useState(false);
  const [isShakerDisplayed, setIsShakerDisplayed] = useState(false);
  const [isDicesRolling, setIsDicesRolling] = useState(false);

  useEffect(() => {
    if (!(provider && address && networkId)) return;

    // only with Ganache
    if (!DISTANT_NETWORKS_IDS.includes(networkId)) {
      setVRFCoordinator(
        new ethers.Contract(
          VRFCoordinatorJson.networks[networkId].address,
          VRFCoordinatorJson.abi,
          provider.getSigner()
        )
      );
    }
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
    if (pawnPosition === null || !pawnInfo || !pawnInfo.random) return;
    console.log("pawnPosition", pawnPosition);

    setRollDice(calculateDicesNumbers(pawnInfo));

    displayPawn(pawnPosition);
    const rarity = getRandomRarity(pawnInfo.random);
    retrieveLandInfo(pawnPosition, rarity);
    forgetPreviousPawnPosition();
  }, [pawnPosition]);

  useEffect(() => {
    setAreDicesDisplayed(!isRoundCompleted);
  }, [isRoundCompleted]);

  const getRandomRarity = (randomness) => {
    // Logical is the same in Bank contract
    const number = getRandomInteger("rarity", 1, 111, randomness);
    // return rarity
    if (number <= 100) return 2;
    if (number <= 110) return 1;
    return 0;
  };

  const getRandomInteger = (type, min, max, randomNumber) => {
    // Simulate another random number from Chainlink VRF random number
    // Logical is the same in Bank contract
    const modulo = max - min + 1;
    const value = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "string"],
      [ethers.BigNumber.from(randomNumber), type]
    );
    const number = ethers.BigNumber.from(ethers.utils.keccak256(value));

    return ethers.BigNumber.from(number).mod(modulo).toNumber() + min;
  };

  useEffect(() => {
    if (!startBlockNumber || !Board || !Bank || !networkId) return;
    if (!DISTANT_NETWORKS_IDS.includes(networkId) && !VRFCoordinator) return;

    subscribeContractsEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startBlockNumber, Board, Bank, networkId, VRFCoordinator]);

  const subscribeContractsEvents = () => {
    Bank.on("RollingDices", (_player, _edition, _requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      console.log("event RollingDices", event);
      setIsShakerDisplayed(true);
      setAreDicesDisplayed(false);
      globalVars.requestedId = _requestID;
      setGlobalVars(globalVars);

      // begin - only with Ganache
      if (
        !networkId ||
        DISTANT_NETWORKS_IDS.includes(networkId) ||
        !_requestID ||
        !VRFCoordinator
      )
        return;

      VRFCoordinator.sendRandomness(_requestID).then(() => {
        console.log("VRFCoordinator response asked");
      });
      // end - only with Ganache
    });
    Board.on("RandomReady", (_requestID, event) => {
      console.log(
        "event RandomReady",
        event,
        event.blockNumber <= startBlockNumber,
        _requestID !== globalVars.requestedId
      );
      if (event.blockNumber <= startBlockNumber) return;
      if (_requestID !== globalVars.requestedId) return;

      console.log("event RandomReady", event);
      setIsShakerDisplayed(false); // todo lancer l'animation 3D
      setIsDicesRolling(false);
      parentUpdateValues();
    });
  };

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

    setMustResetAlert(true);
    setAreDicesDisplayed(false);
    setIsDicesRolling(true);
    try {
      Bank.rollDices(props.edition_id);
    } catch (error) {
      setAreDicesDisplayed(true);
      setIsDicesRolling(false);
    }
  }

  /**
   * name: forgetPreviousPawnPosition
   * description: allows to remove the highlighting of the cell of the previous sum of the dice
   */
  function forgetPreviousPawnPosition() {
    const move = pawnInfo.random.mod(11).toNumber() + 2;
    let previousPosition = pawnPosition - move;
    if (previousPosition < 0) {
      previousPosition += 40;
    }
    if (pawnInfo.isInJail) {
      previousPosition = 30 - move;
    }
    const pawn = document.querySelector(`#cell-${previousPosition} > #pawn`);
    if (pawn && pawn.parentNode && move !== 0) {
      pawn.parentNode.removeChild(pawn);
    }
  }

  /**
   * name: displayPawn
   * description: highlight the cell which is the result of the sum of the dice
   */
  function displayPawn() {
    let pawn = document.querySelector(`#cell-${pawnPosition} > #pawn`);
    if (pawn) return;

    const activeCell = document.getElementById(`cell-${pawnPosition}`);
    pawn = document.createElement("img");
    pawn.src = "images/pawns/pawn.png";
    pawn.className = `pawn pawn-${activeCell.dataset.position}`;
    pawn.id = "pawn";

    activeCell.appendChild(pawn);
  }

  return (
    <div>
      <div className="price">
        {balance}
        {monoSymbol}
      </div>
      <div>{propertyCount} NFT</div>

      <Button
        id="roll_dices"
        type="submit"
        variant="danger"
        size="sm"
        className="btn btn-primary btn-lg btn-block m-2"
        onClick={rollDices}
        disabled={!isRoundCompleted || isDicesRolling}
      >
        Roll the dices!
      </Button>

      <div
        id="dices_shaker"
        className={isShakerDisplayed ? "d-block" : "d-none"}
      >
        <div className="m-3">
          <img
            style={{ height: "9rem", aspectRatio: "1" }}
            src={require("../assets/dices_shaker.gif").default}
            alt="dices shaker"
          />
          <p>Waiting for randomness...</p>
        </div>
      </div>

      <div id="dices" className={areDicesDisplayed ? "d-block" : "d-none"}>
        <div className="m-4 text-center">
          {/* first dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dices/dice_face_${
                rollDice ? rollDice.dices[0] : 1
              }.png`).default
            }
            alt="dice display"
          />
          {/* second dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dices/dice_face_${
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
