import React, {useState, useEffect} from 'react';
import {ethers, utils} from "ethers";

const ObsBalance = (props) => {

  var trigger = false;
  var trigFrom = false;

  const [balance, setBalance] = useState(0);

  const text = props.text;
  const address = window.ethereum.selectedAddress;
  const contract = props.contract;

  useEffect( async () => {
    const fromMe = contract.filters.Transfer(address);
    const toMe = contract.filters.Transfer(null, address);

    contract.on("Transfer", async (log, event, amount) => {
      console.log(amount.toNumber());
      if (trigger){
        var _bal = await contract.balanceOf(address);
        setBalance(_bal);
      }
      trigger = true;
    });

    var _balance = await contract.balanceOf(address)
    setBalance(_balance);
  }, []);
  return(
    <div>
      <output>
        {text + balance}
      </output>
    </div>
  );
}

export default ObsBalance;







