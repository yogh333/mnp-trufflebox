import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Game.css";

import boards from "../data/boards.json";
import Grid from "./Grid";
import User from "./User";
import Land from "./Land";
import InGame from "./InGame";

import BankJson from "../contracts/BankContract.json";
import BoardJson from "../contracts/BoardContract.json";
import MonoJson from "../contracts/MonoContract.json";
import PawnJson from "../contracts/PawnContract.json";
import Spinner from "react-bootstrap/Spinner";

function Game(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;
  const editionID = parseInt(props.edition_id);

  const board = require(`../data/${boards[editionID]}.json`);

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Bank, setBank] = useState(null);
  const [Mono, setMono] = useState(null);
  const [Board, setBoard] = useState(null);
  const [Pawn, setPawn] = useState(null);
  const [visual, setVisual] = useState(<div>Property visual</div>);
  const [landInfo, setLandInfo] = useState({
    id: null,
    title: "undefined",
    prices: { rare: "0", uncommon: "0", common: "0" },
    bprices: { house: "0", hotel: "0" },
  });
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isRetrievingInfo, setIsRetrievingInfo] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [pawnID, setPawnID] = useState(false);
  const [startBlockNumber, setStartBlockNumber] = useState(null);
  const [toggleUpdateValues, setToggleUpdateValues] = useState(null);

  useEffect(() => {
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

    setMono(
      new ethers.Contract(
        MonoJson.networks[networkId].address,
        MonoJson.abi,
        provider.getSigner(address)
      )
    );

    setBoard(
      new ethers.Contract(
        BoardJson.networks[networkId].address,
        BoardJson.abi,
        provider.getSigner(address)
      )
    );

    setPawn(
      new ethers.Contract(
        PawnJson.networks[networkId].address,
        PawnJson.abi,
        provider.getSigner(address)
      )
    );

    provider
      .getBlockNumber()
      .then((_blockNumber) => setStartBlockNumber(_blockNumber));
  }, [provider, address, networkId]);

  useEffect(() => {
    if (!Bank) {
      return;
    }

    updateValues();
    setIsReadyToRender(true);
  }, [Bank]);

  useEffect(() => {
    if (!startBlockNumber || !Board) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, Board]);

  const subscribeContractsEvents = () => {
    Bank.on("PropertyBought", (_player, _propID, event) => {
      console.log(event);
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      updateValues();
      setToggleUpdateValues(!toggleUpdateValues);
    });
  };

  const updateValues = () => {
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

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1"))
    ) {
      setPawnID(_pawnID);
      setCanPlay(true);

      return;
    }

    setCanPlay(false);
    setPawnID(_pawnID);
  };

  const retrieveCellPrices = async (_editionId, _cellID) => {
    console.log("get prices !");

    let propertiesPrices = [];
    for (let rarity = 0; rarity < board.maxLandRarities; rarity++) {
      propertiesPrices[rarity] = await Bank.getPriceOfProp(
        _editionId,
        _cellID,
        rarity
      );
    }

    const HOUSE = 0;
    const HOTEL = 1;
    let buildingsPrices = [];
    buildingsPrices[HOUSE] = await Bank.getPriceOfBuild(
      _editionId,
      _cellID,
      HOUSE
    );
    buildingsPrices[HOTEL] = await Bank.getPriceOfBuild(
      _editionId,
      _cellID,
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
      if (board.lands[cellID].type !== "property") {
        return;
      }

      setIsRetrievingInfo(true);
      const prices = await retrieveCellPrices(board.id, cellID);
      const land = {
        id: cellID,
        title: board.lands[cellID].name,
        type: board.lands[cellID].type,
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

  if (!canPlay) {
    return (
      <InGame
        provider={provider}
        address={address}
        network_id={networkId}
        bank_contract={Bank}
        mono_contract={Mono}
        board_contract={Board}
        pawn_contract={Pawn}
        pawn_id={pawnID}
        edition_id={props.edition_id}
        parent_update_values_function={updateValues}
      />
    );
  }

  return (
    <div className="Game">
      <div className="info-area-1">
        <h2>User info</h2>
        {provider && (
          <User
            provider={provider}
            address={address}
            network_id={networkId}
            edition_id={props.edition_id}
            max_lands={board.maxLands}
            pawn_id={pawnID}
            display_info={displayInfo}
            toggle_update_user_values={toggleUpdateValues}
            bank_contract={Bank}
          />
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
            address={address}
            network_id={networkId}
            provider={provider}
            land_info={landInfo}
            bank_contract={Bank}
            edition_id={props.edition_id}
            max_rarity={board.maxLandRarities}
            rarity_multiplier={board.rarityMultiplier}
            rarity_names={board.rarityNames}
            toggle_update_values={toggleUpdateValues}
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
