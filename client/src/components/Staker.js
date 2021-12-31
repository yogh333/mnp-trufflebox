
import React, {useState, useEffect} from 'react';
import Tairreux from "../contracts/Tairreux.json";
import Rogue from "../contracts/Rogue.json";
import User from "./User.js";

import Spinner from "react-bootstrap/Spinner";

import {ethers} from "ethers";
import ObsBalance from "./ObsBalance";


const Staker = (props) => {

  const spinner = <Spinner as="span" animation="border" size="sm" />;

  const [isReadyToRender, setIsReadyToRender] = useState(false);
  var address = window.ethereum.selectedAddress;

  const [amount, setAmount] = useState("");
  const [effective, setEffective] = useState(0);
  const [deposit, setDeposit] = useState(0);

  const provider = props.p;
  const _networkID = props.n;

  const [MPs, setMPs] = useState(null);
  const [stMPs, setstMPs] = useState(null);

  useEffect(() => {

    if (!(provider && address && _networkID)) {
      setIsReadyToRender(false);
      console.log("render False");
      return
    }
    const _MPs = new ethers.Contract(
      Rogue.networks[_networkID].address,
      Rogue.abi,
      provider.getSigner()
    );
    setMPs(_MPs);
    const _stMPs = new ethers.Contract(
      Tairreux.networks[_networkID].address,
      Tairreux.abi,
      provider.getSigner()
    );
    setstMPs(_stMPs);
    setIsReadyToRender(false);
    if(!(MPs && stMPs))
      console.log("render True");
    setIsReadyToRender(true);
  },[provider]);

  if (!isReadyToRender) {
    return (<>{spinner}</>)
  }
  return(
    <div>
      <div>
        <p>lets go shut up fucking staker</p>
      </div>
      <div>
        <User
          provider={provider}
          address={address}
          network_id={_networkID} />
      </div>
      <div>
        <output name="address">{"_address :" + window.ethereum.selectedAddress}</output>
        <br></br>
        <output> {"your deposit on contract " + deposit} </output>
        <ObsBalance
          text="coin on your wallet "
          contract={MPs}
        />
        <ObsBalance
          text="your deposit on contract "
          contract={stMPs}
        />
        <br></br>
        <input
          type="text"
          value= {amount}
          id="amount"
          onChange={(e) => {
            console.log(e.target.value);
            setAmount(e.target.value);}
          } />
        <br></br>
        <input
          onClick={ async () => {
            var _balance = await MPs.balanceOf(address);
            setAmount(_balance.toNumber());
            setEffective(_balance.toNumber());
          }
          }
          type="button"
          value="MAX"/>
        <div>
          <input
            onClick={ async () => {
              console.log(effective, amount)
              if(amount ==effective){
                await MPs.approve(stMPs.address, amount, {from:address});
                stMPs.depositAll();
              }
            }
            }
            type="button"
            value="Deposit"/>
        </div>
      </div>
    </div>
  );
}

export default Staker;