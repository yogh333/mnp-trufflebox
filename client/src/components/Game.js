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

import BankJson from "../contracts/BankContract.json";
import BoardJson from "../contracts/BoardContract.json";
import MonoJson from "../contracts/MonoContract.json";
import PawnJson from "../contracts/PawnContract.json";
import PropJson from "../contracts/PropContract.json";

function Game(props) {
  const spinner = props.spinner;
  const editionID = "0";

  const board = require(`../data/${boards[parseInt(editionID)]}.json`);

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;
  // Contracts
  const Staking = props.staking_contract;
  // vars
  const monoSymbol = props.mono_symbol;
  const doModalAction = props.do_modal_action;
  const startBlockNumber = props.start_block_number;
  // functions
  const setIsModalShown = props.set_is_modal_shown;
  const setModalHTML = props.set_modal_html;
  const setIsDoingModalAction = props.set_is_doing_modal_action;

  const [Bank, setBank] = useState(null);
  const [Mono, setMono] = useState(null);
  const [Prop, setProp] = useState(null);
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
  const [toggleUpdateValues, setToggleUpdateValues] = useState(null);
  const [isRoundCompleted, setIsRoundCompleted] = useState(true);
  const [pawnInfo, setPawnInfo] = useState(true);
  const [pawnPosition, setPawnPosition] = useState(0);
  const [globalVars, setGlobalVars] = useState({});

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
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      console.log(event);
      updateValues();
      setToggleUpdateValues(!toggleUpdateValues);
    });
    Bank.on("PropertyRentPaid", (_player, _amout, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (address.toLowerCase() !== _player.toLowerCase()) return;

      console.log(event);
      updateValues();
      setToggleUpdateValues(!toggleUpdateValues);
    });
  };

  const updateValues = () => {
    updatePawnInfo();
    updatePlayerInfo();
  };

  const updatePawnInfo = async () => {
    const _pawnBalance = await Pawn.balanceOf(address);

    if (_pawnBalance.toNumber() === 0) {
      return;
    }

    Bank.locatePlayer(editionID).then((_pawnInfo) => {
      setIsRoundCompleted(_pawnInfo.isRoundCompleted);
      setPawnInfo(_pawnInfo);
      setPawnPosition(_pawnInfo.position);
    });
  };

  const updatePlayerInfo = async () => {
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
      isPurchasable: false,
      prices: [0, 0, 0],
    };

    if (Bank != null && board.lands[cellID].isPurchasable) {
      _prices = await retrieveCellPrices(board.id, cellID);
      _landInfo.prices = [
        ethers.utils.formatUnits(_prices.properties[0]),
        ethers.utils.formatUnits(_prices.properties[1]),
        ethers.utils.formatUnits(_prices.properties[2]),
      ];
      _landInfo.rarity = rarity;
      _landInfo.isPurchasable = true;
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
        staking_contract={Staking}
        bank_contract={Bank}
        mono_contract={Mono}
        board_contract={Board}
        pawn_contract={Pawn}
        pawn_id={pawnID}
        edition_id={editionID}
        parent_update_values_function={updateValues}
        start_block_number={startBlockNumber}
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
            mono_contract={Mono}
            board_contract={Board}
            prop_contract={Prop}
            max_lands={board.maxLands}
            land_info={landInfo}
            pawn_id={pawnID}
            retrieve_land_info={retrieveLandInfo}
            parent_update_values_function={updateValues}
            toggle_update_user_values={toggleUpdateValues}
            bank_contract={Bank}
            mono_symbol={monoSymbol}
            is_round_completed={isRoundCompleted}
            set_is_round_completed={setIsRoundCompleted}
            pawn_info={pawnInfo}
            pawn_position={pawnPosition}
            set_global_vars={setGlobalVars}
            global_vars={globalVars}
            start_block_number={startBlockNumber}
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
          is_round_completed={isRoundCompleted}
        />
      </div>
      <div className="info-area-3 text-center">
        <h2>Game info</h2>
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
            bank_contract={Bank}
            prop_contract={Prop}
            edition_id={editionID}
            land_info={landInfo}
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
    </div>
  );
}

export default Game;
