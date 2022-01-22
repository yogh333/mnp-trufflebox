import { useState, useEffect } from "react";

import "../css/User.css";
import Button from "react-bootstrap/Button";
import boards from "../data/boards.json";

export default function Visual(props) {
  const board = require(`../data/${boards[parseInt(props.edition_id)]}.json`);

  // Contracts
  const Bank = props.bank_contract;
  // vars
  const spinner = props.spinner;
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

  const payRent = (event) => {
    if (!(Bank && editionID)) return;

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

  const buyProperty = (event) => {
    if (!(Bank && editionID)) return;

    Bank.buyProp(editionID).then((value) => {
      console.log("Property bought");
      setAlert("Property bought");
      updateValues();
    });
  };

  const receiveChance = (event) => {
    if (!(Bank && editionID)) return;

    Bank.receiveChanceProfit(editionID).then((value) => {
      console.log("Chance profit received");
      setAlert("Chance profit received");
      updateValues();
    });
  };

  const payCommunityTax = (event) => {
    if (!(Bank && editionID)) return;

    Bank.payCommunityTax(editionID).then((value) => {
      console.log("Community tax paid");
      setAlert("Community tax paid");
      updateValues();
    });
  };

  const borderColor = (rarity) => {
    const COLORS = ["yellow", "green", "blue"];
    return COLORS[rarity];
  };

  if (landID === null) {
    return <>{spinner}</>;
  }

  if (rarity !== null && !isRoundCompleted) {
    return (
      <>
        <img
          className="land m-3"
          style={{ border: `1rem solid ${borderColor(rarity)}` }}
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
            onClick={buyProperty}
            data-rarity={rarity.toString()}
            data-land-id={landID.toString()}
          >
            Buy
          </Button>
          <Button
            className="m-1"
            variant="danger"
            size="sm"
            onClick={() => {
              setModalHTML({
                title: "Pay the rent",
                body: "To continue, you must pay a rent. This rent will be shares between NFT owners of this land.",
                button: "Pay",
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

  if (isChanceCard && !isRoundCompleted) {
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
            Receive
          </Button>
        </div>
      </>
    );
  }

  if (isCommunityCard && !isRoundCompleted) {
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
            Pay
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
