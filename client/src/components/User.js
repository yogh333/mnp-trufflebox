import { useState, useEffect } from "react";
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

  // functions
  const displayInfo = props.display_info;

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

    Bank.locatePlayer(props.edition_id).then((_pawnInfo) => {
      setCurrentPosition(_pawnInfo.position);
    });

    provider
      .getBlockNumber()
      .then((_blockNumber) => setStartBlockNumber(_blockNumber));
  }, [address, provider, networkId]);

  useEffect(() => {
    if (!Mono || !Prop) return;

    updateValues();
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
  }, [toggleUpdateValues]);

  useEffect(() => {
    if (!Bank) {
      return;
    }

    Bank.locatePlayer(props.edition_id).then((_pawnInfo) => {
      setCurrentPosition(_pawnInfo.position);
      highlightCurrentCell(_pawnInfo.position);
      displayInfo(_pawnInfo.position);
    });
  }, [Bank]);

  useEffect(() => {
    if (!startBlockNumber || !Board || !Bank) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, Board, Bank]);

  useEffect(() => {
    if (!rollDice) {
      return;
    }

    setAreDicesDisplayed(true);
    setIsShakerDisplayed(false); // todo lancer l'anaimation 3D
    handleNewPosition(currentPosition, rollDice[0] + rollDice[1]);
  }, [rollDice]);

  const subscribeContractsEvents = () => {
    Bank.on("RollingDices", (_player, _edition, _requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      console.log(event);
      setRequestedID(_requestID);
    });
  };

  useEffect(() => {
    if (!requestedID || !Board || !Bank) {
      return;
    }

    if (
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "localhost"
    ) {
      simulateVRFCoordinatorResponse();
    }

    Board.on("RandomReady", (_requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (requestedID !== _requestID) return;

      console.log(event);
      Bank.locatePlayer(props.edition_id).then((_pawnInfo) => {
        setRollDice(calculateDicesNumbers(_pawnInfo.random)); // to throw dices 3D animation and display dices results
      });
    });
  }, [requestedID]);

  const calculateDicesNumbers = (_randomness) => {
    const dicesSum = ethers.BigNumber.from(_randomness).mod(11).toNumber() + 2;
    console.log("dicesSum", dicesSum);
    const diceA =
      Math.floor(Math.random() * Math.min(dicesSum - 1, 6)) +
      Math.max(1, dicesSum - 6);
    console.log("diceA", diceA);
    const diceB = dicesSum - diceA;
    console.log("diceB", diceB);

    return [diceA, diceB];
  };

  const simulateVRFCoordinatorResponse = () => {
    if (
      !(
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "localhost"
      ) ||
      !requestedID
    )
      return;
    VRFCoordinator.sendRandomness(requestedID).then(() =>
      console.log("VRFCoordinator response asked")
    );
  };

  /**
   * name: rollDices
   * description: simulates the roll of dice to move the game forward and to move on the pawn
   */
  function rollDices() {
    if (!Bank || !props.edition_id) return;

    setIsShakerDisplayed(true);

    Bank.rollDices(props.edition_id);

    // random is retrieved with RandomReady(requestId) event
  }

  /**
   * name: handleNewPosition
   * description: make all the operations to determine and to display the new position of the future pawn
   * @param previousPosition
   * @param total
   */
  function handleNewPosition(previousPosition, total) {
    const newCell = (previousPosition + total) % maxCells;

    // todo STOPPER animation roll dices sur le front et lancer l'animation 3D puis à la fin :

    highlightCurrentCell(newCell);
    displayInfo(newCell);
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
      <div>{balance} MONO$</div>
      <div>{propertyCount} PROP$</div>

      <Button
        type="submit"
        variant="danger"
        size="sm"
        className="btn btn-primary btn-lg btn-block"
        onClick={rollDices}
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
        </div>
      </div>

      <div id="dices" className={areDicesDisplayed ? "d-block" : "d-none"}>
        <div className="mt-3 ml-150">
          {/* first dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dice_face_${rollDice ? rollDice[0] : 1}.png`)
                .default
            }
            alt="dice display"
          />
          {/* second dice display */}
          <img
            className="dice-display d-inline-block m-2"
            src={
              require(`../assets/dice_face_${rollDice ? rollDice[1] : 1}.png`)
                .default
            }
            alt="dice display"
          />
        </div>
      </div>
    </div>
  );
}
