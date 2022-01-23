import { useState, useEffect } from "react";
import { ethers } from "ethers";

import PropJson from "../contracts/PropContract.json";

import { Button, Spinner } from "react-bootstrap";

export default function Land(props) {
  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const networkId = props.network_id;
  const address = props.address;
  const provider = props.provider;
  // Contracts
  const Bank = props.bank_contract;
  const Prop = props.prop_contract;
  // vars
  const landInfo = props.land_info;
  const editionId = props.edition_id;
  const maxRarity = props.max_rarity;
  const rarityMultiplier = props.rarity_multiplier;
  const toggleUpdateValues = props.toggle_update_values;
  const monoSymbol = props.mono_symbol;

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
    if (!Prop || !landInfo || landInfo.id === null) return;

    updateValues();
  }, [Prop, landInfo.id]);

  const updateValues = () => {
    if (!Prop || !landInfo.isPurchasable) return;

    Prop.balanceOf(address).then((value) => {
      setPropBalance(value.toNumber());
    });
  };

  useEffect(() => {
    if (toggleUpdateValues === null) return;

    updateValues();
  }, [toggleUpdateValues]);

  useEffect(() => {
    if (
      propBalance === null ||
      !Prop ||
      landInfo.id === null ||
      !landInfo.isPurchasable
    )
      return;

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
  }, [propBalance, Prop, landInfo.id]);

  useEffect(() => {
    if (nbOfPropsByRarity.length !== maxRarity || !Prop) return;

    const fetchPropertiesData = async () => {
      let properties = [];
      let _propertiesCountByRarity = [0, 0, 0];
      for (let index = 0; index < propBalance; index++) {
        const idx = await Prop.tokenOfOwnerByIndex(address, index);
        properties[index] = await Prop.get(idx); // can be used
        if (properties[index].land === landInfo.id) {
          _propertiesCountByRarity[properties[index].rarity]++;
        }
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
        owned: propertiesCountByRarity[rarity],
        left: rarityMultiplier ** rarity - nbOfPropsByRarity[rarity],
      };
    }

    setPropertyInformationByRarity(_propertyInformationByRarity);
  }, [propertiesCountByRarity]);

  if (!landInfo.isPurchasable) {
    return <></>;
  }

  return (
    <>
      <h3 className="mb-2">{landInfo.title}</h3>
      <div className="price">
        <span className="rare">Rare</span> {landInfo.prices[0]}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[0].owned}, left{" "}
        {propertyInformationByRarity[0].left}
      </div>
      <div className="price">
        <span className="uncommon">Uncommon</span> {landInfo.prices[1]}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[1].owned}, left{" "}
        {propertyInformationByRarity[1].left}
      </div>
      <div className="price">
        <span className="common">Common</span> {landInfo.prices[2]}
        {monoSymbol}
      </div>
      <div className="mb-2">
        mine {propertyInformationByRarity[2].owned}, left{" "}
        {propertyInformationByRarity[2].left}
      </div>
    </>
  );
}
