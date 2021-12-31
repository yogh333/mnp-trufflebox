import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Admin.css";

import Paris from "../data/Paris.json";

import BankJson from "../contracts/BankContract.json";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Container from "react-bootstrap/Container";
import MonoJson from "../contracts/MonoContract.json";
import PropJson from "../contracts/PropContract.json";
import BuildJson from "../contracts/BuildContract.json";

function Admin(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Bank, setBank] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [isReadyToRender, setIsReadyToRender] = useState(false);

  useEffect(() => {
    setIsReadyToRender(false);

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

    Bank.ADMIN_ROLE().then((value) => {
      setAdminRole(value);
    });
  }, [Bank]);

  useEffect(() => {
    if (!(Bank && adminRole)) {
      setIsReadyToRender(false);

      return;
    }

    Bank.hasRole(adminRole, address).then((value) => {
      if (!value) {
        window.location.href = "/";

        return;
      }

      setIsReadyToRender(true);
    });
  }, [adminRole, address]);

  async function sendPricesToBank() {
    let commonLandPrices = [];
    let housePrices = [];
    Paris.lands.forEach((land, index) => {
      commonLandPrices[index] = 0;
      if (land.hasOwnProperty("commonPrice")) {
        commonLandPrices[index] = land.commonPrice;
      }

      housePrices[index] = 0;
      if (land.hasOwnProperty("housePrice")) {
        housePrices[index] = land.housePrice;
      }
    });

    await Bank.setPrices(
      Paris.id,
      Paris.maxLands,
      Paris.maxLandRarities,
      Paris.rarityMultiplier,
      Paris.buildingMultiplier,
      commonLandPrices,
      housePrices
    );
  }

  async function setRoles() {
    const Mono = new ethers.Contract(
      MonoJson.networks[networkId].address,
      MonoJson.abi,
      provider.getSigner(address)
    );
    const Prop = new ethers.Contract(
      PropJson.networks[networkId].address,
      PropJson.abi,
      provider.getSigner(address)
    );
    const Build = new ethers.Contract(
      BuildJson.networks[networkId].address,
      BuildJson.abi,
      provider.getSigner(address)
    );

    const ADMIN_ROLE = await Prop.ADMIN_ROLE();
    const MINTER_ROLE = await Prop.MINTER_ROLE();

    Prop.grantRole(MINTER_ROLE, BankJson.networks[networkId].address).then(
      (result) => console.log("minter role granted")
    );
    Build.grantRole(MINTER_ROLE, BankJson.networks[networkId].address).then(
      (result) => console.log("minter role granted")
    );
  }

  if (!isReadyToRender) {
    return <></>;
  }

  return (
    <div className="Admin">
      <Container>
        <h1>Admin</h1>
        <Button className="mx-3" variant="primary" onClick={sendPricesToBank}>
          Send prices to Bank for Paris Board
        </Button>

        <Button className="mx-3" variant="primary" onClick={setRoles}>
          Set roles
        </Button>
      </Container>
    </div>
  );
}

export default Admin;
