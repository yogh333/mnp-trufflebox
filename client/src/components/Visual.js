import { useState, useEffect } from "react";

import "../css/User.css";
import Button from "react-bootstrap/Button";
import boards from "../data/boards.json";

export default function Visual(props) {
  const spinner = props.spinner;
  const editionID = props.edition_id;
  const board = require(`../data/${boards[parseInt(props.edition_id)]}.json`);

  const Bank = props.bank_contract;
  const monoSymbol = props.mono_symbol;
  const landInfo = props.land_info;
  const rarity = landInfo.rarity ? landInfo.rarity : null;
  const landID = landInfo.id;
  const prices = landInfo.prices;

  // functions
  const setIsModalShown = props.set_is_modal_shown;
  const setModalHTML = props.set_modal_html;
  const doModalAction = props.do_modal_action;
  const setIsDoingModalAction = props.set_is_doing_modal_action;
  const updateValues = props.parent_update_values_function;

  useEffect(() => {
    if (!doModalAction) return;

    if (doModalAction === "payRent") {
      payRent();
    }
  }, [doModalAction]);

  const payRent = (event) => {
    if (!(Bank && editionID)) return;

    Bank.payRent(editionID).then((value) => {
      console.log("rent payed");
      setIsDoingModalAction(false);
      setIsModalShown(false);
      updateValues();
    });
  };

  const buyProperty = (event) => {
    if (!(Bank && editionID)) return;

    Bank.buyProp(editionID).then((value) => {
      console.log("Property bought");
      updateValues();
    });
  };

  const borderColor = (rarity) => {
    const COLORS = ["yellow", "green", "blue"];
    return COLORS[rarity];
  };

  if (!landID) {
    return <>{spinner}</>;
  }

  if (rarity !== null) {
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

  return (
    <>
      <img className="land m-3 text-center" src={board.lands[landID].visual} />
    </>
  );
}
