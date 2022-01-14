import { useState, useEffect } from "react";
import { ethers } from "ethers";

import PropJson from "../contracts/PropContract.json";

import { Button, Spinner } from "react-bootstrap";

export default function Land(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const networkId = props.network_id;
  const address = props.address;
  const provider = props.provider;
  const landInfo = props.land_info;
  const Bank = props.bank_contract;
  const editionId = props.edition_id;
  const maxRarity = props.max_rarity;
  const rarityMultiplier = props.rarity_multiplier;
  const toggleUpdateValues = props.toggle_update_values;
  const monoSymbol = props.mono_symbol;

  const [Prop, setProp] = useState(null);
  const [propBalance, setPropBalance] = useState(null);
  const [nbOfPropsByRarity, setNbOfPropsByRarity] = useState([]);
  const [propertiesCountByRarity, setPropertiesCountByRarity] = useState([]);

  let _propertyInformationByRarity = [];
  for (let rarity = 0; rarity < maxRarity; rarity++) {
    _propertyInformationByRarity[rarity] = { owned: spinner, left: spinner };
  }
  const [propertyInformationByRarity, setPropertyInformationByRarity] =
    useState(_propertyInformationByRarity);

  useEffect(() => {
    if (!(provider && address && networkId && landInfo.id && editionId)) return;

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
    if (toggleUpdateValues === null) return;

    updateValues();
  }, [toggleUpdateValues]);

  useEffect(() => {
    if (propBalance === null || !Prop) return;

    const fetchNbOfPropsByRarity = async () => {
      let _nbOfPropsByRarity = [];
      for (let rarity = 0; rarity < maxRarity; rarity++) {
        _nbOfPropsByRarity[rarity] = await Prop.getNbOfProps(
          editionId,
          landInfo.id,
          rarity
        );
      }
      setNbOfPropsByRarity(_nbOfPropsByRarity);
    };

    fetchNbOfPropsByRarity();
  }, [propBalance, Prop]);

  useEffect(() => {
    if (nbOfPropsByRarity.length !== maxRarity || !Prop) return;

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
    if (propertiesCountByRarity.length !== maxRarity) return;

    let _propertyInformationByRarity = [];
    for (let rarity = 0; rarity < maxRarity; rarity++) {
      _propertyInformationByRarity[rarity] = {
        owned: nbOfPropsByRarity[rarity],
        left: rarityMultiplier ** rarity - nbOfPropsByRarity[rarity],
      };
    }

    setPropertyInformationByRarity(_propertyInformationByRarity);
  }, [propertiesCountByRarity]);

  if (landInfo.type !== "property") {
    return <></>;
  }

  return (
    <>
      <h3 className="mb-2">{landInfo.title}</h3>
      <div className="price">
        Rare {landInfo.prices.rare}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[0].owned}, left{" "}
        {propertyInformationByRarity[0].left}
      </div>
      <div className="price">
        Uncommon {landInfo.prices.uncommon}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[1].owned}, left{" "}
        {propertyInformationByRarity[1].left}
      </div>
      <div className="price">
        Common {landInfo.prices.common}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[2].owned}, left{" "}
        {propertyInformationByRarity[2].left}
      </div>
    </>
  );
}
