import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Game.css";

import boards from "../data/boards.json";
import Grid from "./Grid";
import User from "./User";
import Land from "./Land";

import BankJson from "../contracts/BankContract.json";
import Spinner from "react-bootstrap/Spinner";

function Game(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const board = require(`../data/${boards[parseInt(props.edition_id)]}.json`);

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Bank, setBank] = useState(null);
  const [visual, setVisual] = useState(<div>Property visual</div>);
  //const [currentLandId, setCurrentLandId] = useState(0);
  const [landInfo, setLandInfo] = useState({
    id: null,
    title: "undefined",
    prices: { rare: "0", uncommon: "0", common: "0" },
    bprices: { house: "0", hotel: "0" },
  });
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isRetrievingInfo, setIsRetrievingInfo] = useState(false);

  useEffect(() => {
    /*if (window.ethereum && !window.ethereum.selectedAddress) { // Redirect to Home if disconnected
      window.location.href = "/"

      return
    }
*/
    if (!(provider && address && networkId)) {
      return;
    }

    setBank(
      new ethers.Contract(
        BankJson.networks[networkId].address,
        BankJson.abi,
        provider.getSigner(address)
      )
    );
  }, [provider, address, networkId]);

  useEffect(() => {
    if (!Bank) {
      return;
    }

    setIsReadyToRender(true);
  }, [Bank]);

  const retrieveCellPrices = async (editionId, cellID) => {
    console.log("get prices !");

    let propertiesPrices = [];
    for (let rarity = 0; rarity < board.maxLandRarities; rarity++) {
      propertiesPrices[rarity] = await Bank.getPriceOfProp(
        editionId,
        cellID,
        rarity
      );
    }

    const HOUSE = 0;
    const HOTEL = 1;
    let buildingsPrices = [];
    buildingsPrices[HOUSE] = await Bank.getPriceOfBuild(
      editionId,
      cellID,
      HOUSE
    );
    buildingsPrices[HOTEL] = await Bank.getPriceOfBuild(
      editionId,
      cellID,
      HOTEL
    );

    return {
      properties: propertiesPrices,
      buildings: buildingsPrices,
    };
  };

  async function displayInfo(cellID) {
    setVisual(<img className="land" src={board.lands[cellID].visual} />);
    if (Bank != null) {
      setIsRetrievingInfo(true);
      const prices = await retrieveCellPrices(board.id, cellID);
      const land = {
        id: cellID,
        title: board.lands[cellID].name,
        prices: {
          rare: ethers.utils.formatUnits(prices.properties[0]),
          uncommon: ethers.utils.formatUnits(prices.properties[1]),
          common: ethers.utils.formatUnits(prices.properties[2]),
        },
        bprices: {
          house: ethers.utils.formatUnits(prices.buildings[0]),
          hotel: ethers.utils.formatUnits(prices.buildings[1]),
        },
      };
      setLandInfo(land);
      setIsRetrievingInfo(false);
    }
  }

  if (!isReadyToRender) {
    return <>{spinner}</>;
  }

  return (
    <div className="Game">
      <div className="info-area-1">
        <h2>User info</h2>
        {provider && (
          <User provider={provider} address={address} network_id={networkId} />
        )}
      </div>
      <div className="info-area-2">
        <h2>Property Visual</h2>
        {visual}
      </div>
      <div className="info-area-3">
        <h2>Misc</h2>
      </div>
      <div className="info-area-4">
        <h2>Property Info</h2>
        {isRetrievingInfo ? (
          spinner
        ) : (
          <Land
            land_info={landInfo}
            bank_contract={Bank}
            edition_id={props.edition_id}
            address={address}
            network_id={networkId}
            provider={provider}
          />
        )}
      </div>
      <div className="main-area">
        <Grid board={board} displayInfo={displayInfo} />
      </div>
    </div>
  );
}

export default Game;
