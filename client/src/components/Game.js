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
import Spinner from "react-bootstrap/Spinner";
import { Button, Card, Col, Container, Row } from "react-bootstrap";

function Game(props) {
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
  const [startBlockNumber, setStartBlockNumber] = useState(null);

  useEffect(async () => {
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

    const _startBlockNumber = await provider.getBlockNumber();
    setStartBlockNumber(_startBlockNumber);
  }, [provider, address, networkId]);

  useEffect(() => {
    if (!Bank) {
      return;
    }

    updateValues();
    setIsReadyToRender(true);
  }, [Bank]);

  useEffect(async () => {
    if (!startBlockNumber || !Bank) {
      return;
    }

    subscribeContractsEvents();
  }, [startBlockNumber, Bank]);

  const subscribeContractsEvents = () => {
    Bank.on("PlayerEnrolled", (edition, player, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      updateValues();
    });
    Bank.on("DicesRollsPrepaid", (player, quantity, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      updateValues();
    });
    Bank.on("MonoBought", (player, amount, event) => {
      if (event.blockNumber <= startBlockNumber) return;

      updateValues();
    });
  };

  const updateValues = () => {
    updatePlayerInfos();
  };

  const updatePlayerInfos = async () => {
    const monoBalance = await Mono.balanceOf(address);
    const pawnBalance = await Pawn.balanceOf(address);

    Bank.getPlayerInfo(address, props.edition_id).then((playerInfo) => {
      if (playerInfo.isEnrolled === true && playerInfo.prepaidRolls > 0) {
        setIsPerforming(false);
        setCanPlay(true);

        return;
      }

      if (playerInfo.isEnrolled === true) {
        setInGameStep(4);
        setIsPerforming(false);

        return;
      }

      if (
        ethers.BigNumber.from(monoBalance).sub(ethers.utils.parseEther("50")) >=
          ethers.utils.parseEther("0") &&
        pawnBalance.toNumber() > 0
      ) {
        setInGameStep(3);
        setIsPerforming(false);

        return;
      }

      if (
        ethers.BigNumber.from(monoBalance).sub(ethers.utils.parseEther("50")) >=
        ethers.utils.parseEther("0")
      ) {
        setInGameStep(2);
      }

      setIsPerforming(false);
    });
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
    setIsPerforming(true);

    let result;

    result = await Mono.balanceOf(Bank.address);

    try {
      result = await Bank.buyMono({ value: ethers.utils.parseEther("0.5") });
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

  const buyOnePawn = async () => {
    setIsPerforming(true);

    let result;

    result = await Mono.balanceOf(Bank.address);

    console.log(result.toString());

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

  const approveSpentAndEnrollPlayer = async () => {
    if (!props.edition_id) {
      return;
    }

    setIsPerforming(true);

    let result;

    try {
      result = await Mono.allowance(address, Bank.address);
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }

    if (ethers.BigNumber.from(result) < ethers.utils.parseEther("50")) {
      try {
        result = await Mono.approve(
          Bank.address,
          ethers.utils.parseEther("50")
        );
        if (!result.hash) {
          setIsPerforming(false);
          return;
        }
      } catch (error) {
        console.error(error);
        setIsPerforming(false);
        return;
      }
    }

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

  const prepaidDicesRolls = async () => {
    setIsPerforming(true);

    let result = await Board.fee();

    const amountToPrepaid = 50 * ethers.BigNumber.from(result);

    try {
      result = await Link.allowance(address, Bank.address);
    } catch (error) {
      console.error(error);
      setIsPerforming(false);
      return;
    }

    if (ethers.BigNumber.from(result) < amountToPrepaid) {
      try {
        result = await Link.approve(Bank.address, amountToPrepaid);
        if (!result.hash) {
          setIsPerforming(false);
          return;
        }
      } catch (error) {
        console.error(error);
        setIsPerforming(false);
        return;
      }
    }

    try {
      result = await Bank.prepaidDicesRolls(50, props.edition_id);
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
            <Card.Header className="text-center">Buy $MONO</Card.Header>
            <Card.Body>You don't have enough $MONO. Buy Some.</Card.Body>
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
            <Card.Header className="text-center">Buy a pawn</Card.Header>
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
            className={inGameStep === 3 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">Second step</Card.Header>
            <Card.Body>
              Before playing, you must have pawn and give us approval to spent
              50 $MONO.
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={approveSpentAndEnrollPlayer}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Approve"
                )}
              </Button>
            </Card.Footer>
          </Card>

          <Card
            className={inGameStep === 4 ? "m-1" : "d-none"}
            style={{ width: "calc((100% - 2rem)/3)" }}
          >
            <Card.Header className="text-center">Third step</Card.Header>
            <Card.Body>
              Each roll have fee. You must prepaid 50 rolls to play.
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" onClick={prepaidDicesRolls}>
                {isPerforming ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Prepaid 50 rolls"
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
