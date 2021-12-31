import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Spinner from "react-bootstrap/Spinner";

import MonoJson from "../contracts/MonoContract.json";
import BankJson from "../contracts/BankContract.json";
import PropJson from "../contracts/PropContract.json";
import BoardJson from "../contracts/BoardContract.json";
import BuildJson from "../contracts/BuildContract.json";

import "../css/User.css";
import Button from "react-bootstrap/Button";

export default function User(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const address = props.address;
  const networkId = props.network_id;

  const [Bank, setBank] = useState(null);
  const [Board, setBoard] = useState(null);
  const [balance, setBalance] = useState(spinner);
  const [prop, setProp] = useState(spinner);
  const [rollDice, setRollDice] = useState([1, 2]);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    if (!(provider && address && networkId)) {
      return;
    }

    const Mono = new ethers.Contract(
      MonoJson.networks[networkId].address,
      MonoJson.abi,
      provider
    );

    const Prop = new ethers.Contract(
      PropJson.networks[networkId].address,
      PropJson.abi,
      provider
    );

    const Bank = new ethers.Contract(
      BankJson.networks[networkId].address,
      BankJson.abi,
      provider.getSigner()
    );

    const Board = new ethers.Contract(
      BoardJson.networks[networkId].address,
      BoardJson.abi,
      provider.getSigner()
    );

    setBank(Bank);
    setBoard(Board);
    Mono.balanceOf(address).then((value) =>
      setBalance(ethers.utils.formatUnits(value))
    );
    Prop.balanceOf(address).then((value) => setProp(value.toNumber()));
  }, [address, provider, networkId]);

  /**
   * name: rollDiceFunction
   * description: simulates the roll of dice to move the game forward and to move on the pawn
   * @returns {Promise<void>}
   */
  async function rollDiceFunction() {
    if (Board == null) return;

    //Generates a random number by function keccak256 of solidity
    //pb to see
    const Keccak256RandomNumber1 = await Board.getKeccak256RandomNumber();
    console.log("Keccak256RandomNumber: ", Keccak256RandomNumber1);

    const Keccak256RandomNumber2 = await Board.getKeccak256RandomNumber();
    console.log("Keccak256RandomNumber2: ", Keccak256RandomNumber2);

    console.log({ rollDice });

    const total = calculateTotal(Keccak256RandomNumber1, Keccak256RandomNumber2);
    handleNewPosition(currentPosition, total);
    console.log("total:", { total });
    setRollDice([Keccak256RandomNumber1, Keccak256RandomNumber2]);


    //TODO: Replace by the call at the oracle
    //Generates a random number by JS
    /*const generateNewNumber = () => Math.floor(Math.random() * 6 + 1);

    const newValue1 = generateNewNumber();
    const newValue2 = generateNewNumber();

    console.log({ rollDice });

    const total = calculateTotal(newValue1, newValue2);
    handleNewPosition(currentPosition, total);
    console.log("total:", { total });
    setRollDice([newValue1, newValue2]);

     */
  }

  /**
   * name: handleNewPosition
   * description: make all the operations to determine and to display the new position of the future pawn
   * @param previousPosition
   * @param total
   */
  function handleNewPosition(previousPosition, total) {
    const newCell = previousPosition + total;

    //TODO: to define more accurately
    if (newCell >= 40) return;
    highlightCurrentCell(newCell);
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

  /**
   * name: calculateTotal
   * description: calculate the sum of the results of the dice
   * @param args
   * @returns {*}
   */
  function calculateTotal(...args) {
    console.log({ args });
    //sum the parameters
    return args.reduce((total, current) => total + current, 0);
  }

  return (
    <div>
      <div>{balance} MONO$</div>
      <div>{prop} PROP$</div>

      <Button
        type="submit"
        variant="danger"
        size="sm"
        className="btn btn-primary btn-lg btn-block"
        onClick={rollDiceFunction}
      >
        Roll the dice!
      </Button>

      <div className="mt-3 ml-150">
        {/* first dice display */}
        <img
          className="dice-display"
          src={require(`../assets/dice_face_${rollDice[0]}.png`).default}
          alt="dice display"
        />
      </div>

      <div className="mt-3 ml-150">
        {/* second dice display */}
        <img
          className="dice-display"
          src={require(`../assets/dice_face_${rollDice[1]}.png`).default}
          alt="dice display"
        />
      </div>
    </div>
  );
}
