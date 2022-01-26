import { useState, useEffect } from "react";

import "../css/User.css";
import Button from "react-bootstrap/Button";
import boards from "../data/boards.json";
import { ethers } from "ethers";

export default function Visual(props) {
  const board = require(`../data/${boards[parseInt(props.edition_id)]}.json`);

  // Contracts
  const Bank = props.bank_contract;
  const Mono = props.mono_contract;
  // vars
  const spinner = props.spinner;
  const address = props.address;
  const editionID = props.edition_id;
  const monoSymbol = props.mono_symbol;
  const landInfo = props.land_info;
  const rarity = landInfo.rarity;
  const isChanceCard = landInfo.type === "chance";
  const isCommunityCard = landInfo.type === "community-chest";
  const landID = landInfo.id;
  const prices = landInfo.prices;
  const isRoundCompleted = props.is_round_completed;
  const doModalAction = props.do_modal_action;
  const mustResetAlert = props.must_reset_alert;
  const pawnInfo = props.pawn_info;
  const isProcessing = props.is_processing;
  const setIsProcessing = props.set_is_processing;
  const areDiceRolling = props.are_dice_rolling;
  // functions
  const setIsModalShown = props.set_is_modal_shown;
  const setModalHTML = props.set_modal_html;
  const setIsDoingModalAction = props.set_is_doing_modal_action;
  const updateValues = props.parent_update_values_function;
  const setMustResetAlert = props.set_must_reset_alert;

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!doModalAction) return;

    if (doModalAction === "payRent") {
      payRent();
    }
  }, [doModalAction]);

  useEffect(() => {
    if (!mustResetAlert) return;

    setAlert(null);
    setMustResetAlert(false);
  }, [mustResetAlert]);

  const retrievePropertyRent = (_price) => {
    return parseInt(_price) / 100 > 1 ? parseInt(_price) / 100 : 1;
  };

  const retrieveChanceProfit = () => {
    return getRandomInteger("chance", 1, 50, pawnInfo.random);
  };

  const retrieveCommunityTax = () => {
    return getRandomInteger("community", 1, 50, pawnInfo.random);
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

  const payRent = async (event) => {
    if (!(Bank && editionID)) return;

    let isValid = await checkBalance(retrievePropertyRent().toString());
    if (!isValid) return;

    isValid = await checkAllowance(retrievePropertyRent().toString());
    if (!isValid) return;

    Bank.payRent(editionID).then((value) => {
      console.log("rent payed");
      setIsDoingModalAction(false);
      setIsModalShown(false);
      // reset modal data
      setModalHTML({
        title: "",
        body: "",
        button: "",
        action: "",
      });
      setAlert("Rent payed");
      updateValues();
    });
  };

  const checkBalance = async (_amount) => {
    const playerBalance = await Mono.balanceOf(address);
    if (playerBalance.lt(ethers.utils.parseEther(_amount))) {
      console.log("Too low player balance.");
      return false;
    }

    return true;
  };

  const checkAllowance = async (_amount) => {
    const allowance = await Mono.allowance(address, Bank.address);

    if (allowance.lt(ethers.utils.parseEther(_amount))) {
      try {
        const result = await Mono.approve(
          Bank.address,
          ethers.utils.parseEther(_amount)
        );
        if (!result.hash) {
          return false;
        }
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    return true;
  };

  const buyProperty = async (event) => {
    if (!(Bank && editionID)) return;

    setIsProcessing(true);

    let isValid = await checkBalance(prices[rarity]);
    if (!isValid) {
      setIsProcessing(false);
    }

    isValid = await checkAllowance(prices[rarity]);
    if (!isValid) {
      setIsProcessing(false);
    }

    Bank.buyProp(editionID).then(
      (value) => {
        console.log("Property bought");
        setAlert("Property bought");
        updateValues();
      },
      (error) => {
        setIsProcessing(false);
      }
    );
  };

  const receiveChance = (event) => {
    if (!(Bank && editionID)) return;

    setIsProcessing(true);

    Bank.receiveChanceProfit(editionID).then(
      (value) => {
        console.log("Chance profit received");
        setAlert("Chance profit received");
        updateValues();
      },
      (error) => {
        setIsProcessing(false);
      }
    );
  };

  const payCommunityTax = async (event) => {
    if (!(Bank && editionID)) return;

    setIsProcessing(true);

    let isValid = await checkBalance(retrieveCommunityTax().toString());
    if (!isValid) {
      setIsProcessing(false);
    }

    isValid = await checkAllowance(retrieveCommunityTax().toString());
    if (!isValid) {
      setIsProcessing(false);
    }

    Bank.payCommunityTax(editionID).then(
      (value) => {
        console.log("Community tax paid");
        setAlert("Community tax paid");
        updateValues();
      },
      (error) => {
        setIsProcessing(false);
      }
    );
  };

  const cardStyle = (_rarity) => {
    const COLORS = ["gold", "green", "blue"];
    return {
      boxShadow: `0 0 1rem ${COLORS[rarity]}`,
      filter: `drop-shadow(0 0 1rem ${COLORS[rarity]})`,
    };
  };

  if (landID === null) {
    return <>{spinner}</>;
  }

  if (rarity !== null && !isRoundCompleted && !areDiceRolling) {
    return (
      <>
        <img
          className="land m-3"
          style={cardStyle(rarity)}
          src={board.lands[landID].visual}
        />
        <div className="price">
          <span>price : {prices[rarity]}</span>
          {monoSymbol}
        </div>
        <div>
          <Button
            className="m-1"
            variant="success"
            size="sm"
            disabled={isProcessing}
            onClick={buyProperty}
            data-rarity={rarity.toString()}
            data-land-id={landID.toString()}
          >
            {isProcessing ? spinner : "Buy"}
          </Button>
          <Button
            className="m-1"
            variant="danger"
            size="sm"
            disabled={isProcessing}
            onClick={() => {
              setModalHTML({
                title: "Pay the rent",
                body: "To continue, you must pay a rent. This rent will be shares between NFT owners of this land.",
                button: `Pay ${retrievePropertyRent(prices[rarity])} $MONO`,
                action: "payRent",
              });
              setIsModalShown(true);
            }}
          >
            Don't
          </Button>
        </div>
      </>
    );
  }

  if (isChanceCard && !isRoundCompleted && !areDiceRolling) {
    return (
      <>
        <img
          className="land m-3 text-center"
          style={{ border: "2px solid black" }}
          src={board.lands[landID].visual}
        />

        <div>
          <Button
            className="m-1"
            variant="success"
            size="sm"
            onClick={receiveChance}
          >
            {isProcessing
              ? spinner
              : `Receive ${retrieveChanceProfit().toString()}`}
            {monoSymbol}
          </Button>
        </div>
      </>
    );
  }

  if (isCommunityCard && !isRoundCompleted && !areDiceRolling) {
    return (
      <>
        <img
          className="land m-3 text-center"
          style={{ border: "2px solid black" }}
          src={board.lands[landID].visual}
        />

        <div>
          <Button
            className="m-1"
            variant="success"
            size="sm"
            onClick={payCommunityTax}
          >
            {isProcessing
              ? spinner
              : `Pay ${retrieveCommunityTax().toString()}`}
            {monoSymbol}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <img
        className="land m-3 text-center"
        style={{ border: "2px solid black" }}
        src={board.lands[landID].visual}
      />
      <div className={alert ? "d-block" : "d-none"}>
        <div className="alert alert-success m-3">{alert}</div>
      </div>
    </>
  );
}
