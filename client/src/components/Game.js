import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Game.css";

import boards from "../data/boards.json";
import Grid from "./Grid";
import User from "./User";
import Land from "./Land";

import BankJson from "../contracts/BankContract.json";
import BoardJson from "../contracts/BoardContract.json";
import MonoJson from "../contracts/MonoContract.json";
import LinkJson from "../contracts/Link.json";
import PawnJson from "../contracts/PawnContract.json";
import StakingJson from "../contracts/StakingContract.json";
import Spinner from "react-bootstrap/Spinner";
import { Button, Card, Container } from "react-bootstrap";

function Game(props) {
  const IN_GAME_MONO_AMOUNT = 50;

  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const board = require(`../data/${boards[parseInt(props.edition_id)]}.json`);

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Bank, setBank] = useState(null);
  const [Mono, setMono] = useState(null);
  const [Link, setLink] = useState(null);
  const [Board, setBoard] = useState(null);
  const [Pawn, setPawn] = useState(null);
  const [Staking, setStaking] = useState(null);
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
  const [canPlay, setCanPlay] = useState(false);
  const [isPerforming, setIsPerforming] = useState(false);
  const [inGameStep, setInGameStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);

  const [startBlockNumber, setStartBlockNumber] = useState(null);
  const [monoBalance, setMonoBalance] = useState(null);
  const [pawnBalance, setPawnBalance] = useState(ethers.utils.parseEther("0"));
  const [monoToBuy, setMonoToBuy] = useState(0);
  const [networkTokensToBuy, setNetworkTokensToBuy] = useState(null);

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

    setLink(
      new ethers.Contract(
        LinkJson.networks[networkId].address,
        LinkJson.abi,
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

    setStaking(
      new ethers.Contract(
        StakingJson.networks[networkId].address,
        StakingJson.abi,
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
    if (!startBlockNumber || !Bank) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, Bank]);

  const subscribeContractsEvents = () => {
    Bank.on("PlayerEnrolled", (edition, player, event) => {
      console.log(event);
      if (event.blockNumber <= startBlockNumber) return;
      console.log("after");
      console.log(event);

      updateValues();
    });
    Bank.on("DicesRollsPrepaid", (player, quantity, event) => {
      console.log(event);
      if (event.blockNumber <= startBlockNumber) return;
      console.log("after");
      console.log(event);

      updateValues();
    });
    Bank.on("MonoBought", (player, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (player.toLowerCase() !== address) return;

      updateValues();
    });
    Mono.on("Approval", (owner, spender, value, event) => {
      if (event.blockNumber <= startBlockNumber) return;
      if (owner.toLowerCase() !== address) return;

      updateValues();
    });
  };

  const updateValues = () => {
    setIsPerforming(false);

    updatePlayerInfos();
  };

  const updatePlayerInfos = async () => {
    const _monoBalance = await Mono.balanceOf(address);
    const _pawnBalance = await Pawn.balanceOf(address);

    let _isRegistered;

    if (_pawnBalance.toNumber() > 0) {
      const _pawnID = await Pawn.tokenOfOwnerByIndex(address, 0);
      _isRegistered = await Board.isRegistered(props.edition_id, _pawnID);
    }

    const _monoToBuy = Math.ceil(
      IN_GAME_MONO_AMOUNT -
        Number(ethers.utils.formatEther(_monoBalance)).toFixed(2) +
        (_pawnBalance.toNumber() > 0 ? 0 : 1)
    );

    const setData = (_step) => {
      setInGameStep(_step);
      setCanPlay(false);
      setIsPerforming(false);
      setMonoBalance(_monoBalance);
      setPawnBalance(_pawnBalance);
      setIsRegistered(_isRegistered);
      setMonoToBuy(_monoToBuy);
    };

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(
        ethers.utils.parseEther("1") //todo qui paye le gas qd le contrat tranfertFrom MONO ?
      )
    ) {
      setData(5);
      setCanPlay(true);

      return;
    }

    const allowance = await Mono.allowance(address, Bank.address);

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(
        ethers.utils.parseEther("1") //todo qui paye le gas qd le contr ct tranfertFrom MONO ?
      ) &&
      ethers.BigNumber.from(allowance).gte(ethers.utils.parseEther("1")) &&
      _pawnBalance.toNumber() > 0
    ) {
      setData(4);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(allowance).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (_pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      ) &&
      _pawnBalance.toNumber() > 0
    ) {
      setData(4);

      return;
    }

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1")) &&
      ethers.BigNumber.from(allowance).gte(ethers.utils.parseEther("1"))
    ) {
      setData(3);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(allowance).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (_pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      )
    ) {
      setData(3);

      return;
    }

    if (
      _isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(ethers.utils.parseEther("1"))
    ) {
      setData(2);

      return;
    }

    if (
      !_isRegistered &&
      ethers.BigNumber.from(_monoBalance).gte(
        ethers.utils.parseEther(_monoToBuy.toString())
      )
    ) {
      setData(2);

      return;
    }

    // Tester si enrolled
    // Step 1
    const monoLastPrice = await Staking.getLastPrice(Mono.address);
    const networkTokenVirtualAddress =
      await Staking.NETWORK_TOKEN_VIRTUAL_ADDRESS();
    const networkTokenLastPrice = await Staking.getLastPrice(
      networkTokenVirtualAddress
    );

    setNetworkTokensToBuy(
      Math.ceil(
        ((_monoToBuy * monoLastPrice) / networkTokenLastPrice) * 10 ** 18
      )
    );
    setData(1);
  };

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

  const buyMono = async () => {
    if (networkTokensToBuy === 0) {
      return;
    }

    setIsPerforming(true);

    try {
      const result = await Bank.buyMono({ value: networkTokensToBuy });
      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  const approveSpent = async () => {
    if (!props.edition_id) {
      return;
    }

    const _pawnBalance = await Pawn.balanceOf(address);

    console.log(_pawnBalance);
    console.log(pawnBalance);

    setIsPerforming(true);

    let result;

    try {
      result = await Mono.allowance(address, Bank.address);
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }

    if (
      ethers.BigNumber.from(result).gte(
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      )
    ) {
      console.log("updateValues()");
      updateValues();
      return;
    }

    try {
      result = await Mono.approve(
        Bank.address,
        ethers.utils.parseEther(
          (
            IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
          ).toString()
        )
      );

      setIsPerforming(false);
      if (!result) {
        return;
      }

      // Not waiting for Approve event
      console.log("updateValues()");
      updateValues();
    } catch (error) {
      console.error(error);
      return;
    }
  };

  const buyOnePawn = async () => {
    setIsPerforming(true);

    let result;

    try {
      result = await Bank.buyPawn();
      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  const enrollPlayer = async () => {
    if (!props.edition_id) {
      return;
    }

    setIsPerforming(true);

    let result;

    try {
      result = await Bank.enrollPlayer(props.edition_id);
      if (!result.hash) {
        setIsPerforming(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }
  };

  if (!isReadyToRender) {
    return <>{spinner}</>;
  }

  if (!canPlay) {
    return (
      <Container>
        <div className={"d-flex justify-content-center"}>
          <Card
            className={inGameStep === 1 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">
              Buy $MONO{isRegistered ? "" : " (in game step 1/4)"}
            </Card.Header>
            <Card.Body>
              Before playing, you must buy {monoToBuy.toString()} $MONO.
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={buyMono}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Buy"
                )}
              </Button>
            </Card.Footer>
          </Card>

          <Card
            className={inGameStep === 2 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">
              Give allowance{!isRegistered ? " (in game step 2/4)" : ""}
            </Card.Header>
            <Card.Body>
              You must give us allowance to spent{" "}
              {(
                IN_GAME_MONO_AMOUNT + (pawnBalance.toNumber() > 0 ? 0 : 1)
              ).toString()}{" "}
              $MONO
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={approveSpent}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Approve"
                )}
              </Button>
            </Card.Footer>
          </Card>

          <Card
            className={inGameStep === 3 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">
              Buy a pawn{!isRegistered ? " (in game step 3/4)" : ""}
            </Card.Header>
            <Card.Body>You don't have a pawn. Buy one.</Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={buyOnePawn}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Buy"
                )}
              </Button>
            </Card.Footer>
          </Card>

          <Card
            className={inGameStep === 4 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">
              Enroll{!isRegistered ? " (in game step 4/4)" : ""}
            </Card.Header>
            <Card.Body>Last step, inscription to the board.</Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={enrollPlayer}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Go"
                )}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <div className="Game">
      <div className="info-area-1">
        <h2>User info</h2>
        {provider && (
          <User provider={provider} address={address} network_id={networkId} max_lands={board.maxLands}/>
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
