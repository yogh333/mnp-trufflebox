import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Game.css";
import boards from "../data/boards.json";

import Grid from "./Grid";
import User from "./User";
import Land from "./Land";
import Visual from "./Visual";
import InGame from "./InGame";
import DiceBoard from "./DiceBoard/DiceBoard";

import BankJson from "../contracts/BankContract.json";
import BoardJson from "../contracts/BoardContract.json";
import MonoJson from "../contracts/MonoContract.json";
import PawnJson from "../contracts/PawnContract.json";

function Game(props) {
  const spinner = props.spinner;
  const editionID = "0";

  const board = require(`../data/${boards[parseInt(editionID)]}.json`);

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const monoSymbol = props.mono_symbol;

  // functions
  const setIsModalShown = props.set_is_modal_shown;
  const setModalHTML = props.set_modal_html;
  const setIsDoingModalAction = props.set_is_doing_modal_action;
  const doModalAction = props.do_modal_action;

  const [Bank, setBank] = useState(null);
  const [Mono, setMono] = useState(null);
  const [Board, setBoard] = useState(null);
  const [Pawn, setPawn] = useState(null);
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
    console.log({Bank});

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

    let _isRegistered = false,
      _pawnID;
    if (_pawnBalance.toNumber() > 0) {
      _pawnID = await Pawn.tokenOfOwnerByIndex(address, 0);
      _isRegistered = await Board.isRegistered(editionID, _pawnID);
    }

    setCanPlay(
      _isRegistered &&
        ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1"))
    );
    setPawnID(_pawnID);
    setIsReadyToRender(true);
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

    return {
      properties: propertiesPrices,
    };
  };

  async function retrieveLandInfo(cellID, rarity) {
    setIsRetrievingInfo(true);
    let _prices;
    let _landInfo = {
      id: cellID,
      title: board.lands[cellID].name,
      type: board.lands[cellID].type,
      rarity: null,
      prices: [0, 0, 0],
    };

    if (Bank != null && board.lands[cellID].type === "property") {
      _prices = await retrieveCellPrices(board.id, cellID);
      _landInfo.prices = [
        ethers.utils.formatUnits(_prices.properties[0]),
        ethers.utils.formatUnits(_prices.properties[1]),
        ethers.utils.formatUnits(_prices.properties[2]),
      ];
      _landInfo.rarity = rarity;
    }

    setLandInfo(_landInfo);
    setIsRetrievingInfo(false);
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
        edition_id={editionID}
        parent_update_values_function={updateValues}
      />
    );
  }

  return (
    <div className="Game">
      <div className="info-area-1 text-center">
        <h2>User info</h2>
        {provider && (
          <User
            provider={provider}
            address={address}
            network_id={networkId}
            edition_id={editionID}
            max_lands={board.maxLands}
            pawn_id={pawnID}
            retrieve_land_info={retrieveLandInfo}
            toggle_update_user_values={toggleUpdateValues}
            bank_contract={Bank}
            mono_symbol={monoSymbol}
          />
        )}
      </div>
      <div className="info-area-2 text-center">
        <Visual
          spinner={spinner}
          land_info={landInfo}
          bank_contract={Bank}
          edition_id={editionID}
          mono_symbol={monoSymbol}
          set_is_modal_shown={setIsModalShown}
          set_modal_html={setModalHTML}
          do_modal_action={doModalAction}
          set_is_doing_modal_action={setIsDoingModalAction}
          parent_update_values_function={updateValues}
        />
      </div>
      <div className="info-area-3">
        <h2>Misc</h2>
      </div>
      <div className="info-area-4 text-center">
        <h2>NFT Info</h2>
        {isRetrievingInfo ? (
          spinner
        ) : (
          <Land
            address={address}
            network_id={networkId}
            provider={provider}
            land_info={landInfo}
            bank_contract={Bank}
            edition_id={editionID}
            max_rarity={board.maxLandRarities}
            rarity_multiplier={board.rarityMultiplier}
            rarity_names={board.rarityNames}
            toggle_update_values={toggleUpdateValues}
            mono_symbol={monoSymbol}
          />
        )}
      </div>
      <div className="main-area">
        <Grid
          board={board}
          retrieve_land_info={retrieveLandInfo}
          mono_symbol={monoSymbol}
        />
      </div>
      <DiceBoard />
    </div>
  );
}

export default Game;
