import { useState, useEffect } from "react";
import { ethers } from "ethers";

import PropJson from "../contracts/PropContract.json";
import BuildJson from "../contracts/BuildContract.json";

import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

export default function Land(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const landInfo = props.land_info;
  const Bank = props.bank_contract;
  const editionId = props.edition_id;
  const networkId = props.network_id;
  const address = props.address;
  const provider = props.provider;
  const toggleUpdateValues = props.toggle_update_values;

  const [Prop, setProp] = useState(null);
  const [propBalance, setPropBalance] = useState(null);
  const [nbOfPropsByRarity, setNbOfPropsByRarity] = useState([]);
  const [propertiesCountByRarity, setPropertiesCountByRarity] = useState([]);

  const [propRare, setPropRare] = useState(spinner);
  const [propUncommon, setPropUncommon] = useState(spinner);
  const [propCommon, setPropCommon] = useState(spinner);
  const [propRareLeft, setPropRareLeft] = useState(spinner);
  const [propUncommonLeft, setPropUncommonLeft] = useState(spinner);
  const [propCommonLeft, setPropCommonLeft] = useState(spinner);

  useEffect(() => {
    if (!(provider && address && networkId && landInfo.id && editionId)) {
      return;
    }

    setProp(
      new ethers.Contract(
        PropJson.networks[networkId].address,
        PropJson.abi,
        provider
      )
    );
  }, [address, provider, networkId, landInfo.id, editionId]);

  useEffect(() => {
    if (!Prop) return;

    updateValues();
  }, [Prop, landInfo.id]);

  const updateValues = () => {
    if (!Prop || landInfo.type !== "property") return;

    Prop.balanceOf(address).then((value) => {
      setPropBalance(value.toNumber());
    });
  };

  useEffect(() => {
    if (toggleUpdateValues === null) {
      return;
    }

    updateValues();
  }, [toggleUpdateValues]);

  useEffect(() => {
    if (!propBalance || !Prop) {
      return;
    }

    let _nbOfPropsByRarity = [];
    const fetchNbOfPropsByRarity = async (rarity) => {
      Prop.getNbOfProps(editionId, landInfo.id, rarity).then((value) => {
        _nbOfPropsByRarity[rarity] = value;
        setNbOfPropsByRarity(_nbOfPropsByRarity);
      });
    };

    if (landInfo.type === "property") {
      for (let rarity = 0; rarity < 3; rarity++) {
        fetchNbOfPropsByRarity(rarity);
      }
    }
  }, [propBalance, Prop]);

  useEffect(() => {
    if (nbOfPropsByRarity.length === 0 || !Prop) {
      return;
    }

    const fetchPropertiesData = async () => {
      let properties = [];
      let _propertiesCountByRarity = [0, 0, 0];
      for (let index = 0; index < propBalance; index++) {
        const idx = await Prop.tokenOfOwnerByIndex(address, index);
        properties[index] = await Prop.get(idx); // can be used
        _propertiesCountByRarity[properties[index].rarity]++;
      }

      setPropertiesCountByRarity(_propertiesCountByRarity);
    };

    fetchPropertiesData();
  }, [nbOfPropsByRarity, Prop]);

  useEffect(() => {
    if (propertiesCountByRarity.length === 0) {
      return;
    }

    setPropRare(nbOfPropsByRarity[0]);
    setPropUncommon(nbOfPropsByRarity[1]);
    setPropCommon(nbOfPropsByRarity[2]);
    setPropRareLeft(1 - nbOfPropsByRarity[0]);
    setPropUncommonLeft(10 - nbOfPropsByRarity[1]);
    setPropCommonLeft(100 - nbOfPropsByRarity[2]);
  }, [propertiesCountByRarity]);

  const buyProperty = async (event) => {
    if (!(Bank && editionId && landInfo.id && networkId)) {
      return;
    }

    const rarity = event.target.getAttribute("data-rarity");
    Bank.buyProp(editionId, landInfo.id, rarity).then((value) =>
      console.log("Property buy")
    );
  };

  if (landInfo.type !== "property") {
    return (
      <>
        <div>Select a land on board</div>
      </>
    );
  }

  return (
    <>
      <div>{landInfo.title}</div>
      <div>
        Rare price: {landInfo.prices.rare} MONO$
        <br />
        <Button
          variant="primary"
          size="sm"
          onClick={buyProperty}
          data-rarity="0"
        >
          Buy
        </Button>{" "}
        balance: {propRare}, {propRareLeft} left
      </div>
      <div>
        Uncommon price: {landInfo.prices.uncommon} MONO$
        <br />
        <Button
          variant="primary"
          size="sm"
          onClick={buyProperty}
          data-rarity="1"
        >
          Buy
        </Button>{" "}
        balance: {propUncommon}, {propUncommonLeft} left
      </div>
      <div>
        Common price: {landInfo.prices.common} MONO$
        <br />
        <Button
          variant="primary"
          size="sm"
          onClick={buyProperty}
          data-rarity="2"
        >
          Buy
        </Button>{" "}
        balance: {propCommon}, {propCommonLeft} left
      </div>
    </>
  );
}
