import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Spinner from "react-bootstrap/Spinner";

import MonoJson from "../contracts/MonoContract.json";
import BankJson from "../contracts/BankContract.json";
import PropJson from "../contracts/PropContract.json";
import BoardJson from "../contracts/BoardContract.json";

import "../css/User.css";
import Button from "react-bootstrap/Button";

export default function User(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const address = props.address;
  const networkId = props.network_id;
  const maxCells = props.max_lands;
  const toggleUpdateValues = props.toggle_update_user_values;

  // functions
  const displayInfo = props.display_info;

  const [Bank, setBank] = useState(null);
  const [Mono, setMono] = useState(null);
  const [Prop, setProp] = useState(null);
  const [Board, setBoard] = useState(null);
  const [balance, setBalance] = useState(spinner);
  const [propertyCount, setPropertyCount] = useState(spinner);
  const [rollDice, setRollDice] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [startBlockNumber, setStartBlockNumber] = useState(null);
  const [areDicesDisplayed, setAreDicesDisplayed] = useState(false);

  let requestedID;

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

    setBank(
      new ethers.Contract(
        BankJson.networks[networkId].address,
        BankJson.abi,
        provider.getSigner()
      )
    );

    setBoard(
      new ethers.Contract(
        BoardJson.networks[networkId].address,
        BoardJson.abi,
        provider.getSigner()
      )
    );

    //todo retrieve original position
    const initialPosition = 0;
    highlightCurrentCell(initialPosition);
    displayInfo(initialPosition);

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

  /*  useEffect(() => {
    if (!Board) {
      return;
    }

    Board.getPawn().then((_position) => setCurrentPosition(_position));
  }, [Board]);*/

  useEffect(() => {
    if (!startBlockNumber || !Board) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, Board]);

  useEffect(() => {
    if (!rollDice) {
      return;
    }

    setAreDicesDisplayed(true);
    handleNewPosition(currentPosition, rollDice[0] + rollDice[1]);
  }, [rollDice]);

  const subscribeContractsEvents = () => {
    Board.on("RandomNumberRequested", (_player, _requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      requestedID = _requestID;
    });

    Board.on("RandomReady", (_requestID, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (requestedID !== _requestID) return;

      Board.getRandomNumbers(props.edition_id, props.pawn_id).then(
        (_numbers) => {
          setRollDice(_numbers);
        }
      );
    });
  };

  /**
   * name: rollDiceFunction
   * description: simulates the roll of dice to move the game forward and to move on the pawn
   */
  function rollDiceFunction() {
    if (!Board || !props.edition_id || !props.pawn_id) return;

    // todo Declencher animation roll dices sur le front

    Board.requestRandomNumber(props.edition_id, props.pawn_id);

    // les random numbers sont récupérés avec l'event RandomReady(requestId)
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
        onClick={rollDiceFunction}
      >
        Roll the dice!
      </Button>

      <div id="dices" className={areDicesDisplayed ? "d-block" : "d-none"}>
        <div className="mt-3 ml-150">
          {/* first die display */}
          <img
            className="dice-display"
            src={
              require(`../assets/dice_face_${rollDice ? rollDice[0] : 1}.png`)
                .default
            }
            alt="dice display"
          />
        </div>

        <div className="mt-3 ml-150">
          {/* second die display */}
          <img
            className="dice-display"
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
