import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ethers } from "ethers";

import "../css/Admin.css";

import Paris from "../data/Paris.json";

import BankJson from "../contracts/BankContract.json";
import MonoJson from "../contracts/MonoContract.json";
import PropJson from "../contracts/PropContract.json";
import BuildJson from "../contracts/BuildContract.json";
import StakingJson from "../contracts/StakingContract.json";

import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";

function Admin(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const provider = props.provider;
  const networkId = props.network_id;
  const address = props.address;

  const [Bank, setBank] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [isAddingPool, setIsAddingPool] = useState(false);

  let newPool = {
    token: null,
    prideFeed: null,
    yield: null,
  };

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

  const addPool = async () => {
    const Staking = new ethers.Contract(
      StakingJson.networks[networkId].address,
      StakingJson.abi,
      provider.getSigner(address)
    );

    setIsAddingPool(true);

    try {
      await Staking.addPool(
        newPool.token.value,
        newPool.prideFeed.value,
        newPool.yield.value
      );
    } catch (error) {
      console.error(error);
    }

    setIsAddingPool(false);
  };

  if (!isReadyToRender) {
    return <></>;
  }

  return (
    <div className="Admin">
      <Container>
        <h1>Admin</h1>

        <Card>
          <Card.Header className="text-center">
            <strong>Send prices to Bank for Paris Board</strong>
          </Card.Header>
          <Card.Body className="text-center">
            <Button
              className="mx-3"
              variant="primary"
              onClick={sendPricesToBank}
            >
              Send
            </Button>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="text-center">
            <strong>Set default roles</strong>
          </Card.Header>
          <Card.Body className="text-center">
            <Button className="mx-3" variant="primary" onClick={setRoles}>
              Set
            </Button>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="text-center">
            <strong>Add a new pool</strong>
          </Card.Header>
          <Card.Body className="text-center">
            <Form id="addPool">
              <Row className="mb-3">
                <Form.Group as={Col}>
                  <Form.Label>Token address</Form.Label>
                  <Form.Control
                    type="text"
                    id="poolTokenAddress"
                    ref={(input) => {
                      newPool.token = input;
                    }}
                  />
                </Form.Group>

                <Form.Group as={Col}>
                  <Form.Label>Token price feed</Form.Label>
                  <Form.Control
                    type="text"
                    id="poolTokenPriceFeed"
                    ref={(input) => {
                      newPool.prideFeed = input;
                    }}
                  />
                </Form.Group>

                <Form.Group as={Col}>
                  <Form.Label>Yield in %</Form.Label>
                  <Form.Control
                    type="text"
                    id="poolYield"
                    ref={(input) => {
                      newPool.yield = input;
                    }}
                  />
                </Form.Group>
              </Row>

              <Button variant="primary" onClick={addPool}>
                {isAddingPool ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Add"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default Admin;
