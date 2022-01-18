const { ethers } = require("ethers");

require("dotenv").config();

const mnemonic = process.env["MNEMONIC"];
const infuraProjectId = process.env["INFURA_PROJECT_ID"];
const privateKey = process.env["PRIVATE_KEY"];

const boardJSON = require("../client/src/contracts/BoardContract.json");
const { isEVMException } = require("../test/utils");

/*const provider = new ethers.providers.JsonRpcProvider(
  "https://kovan.infura.io/v3/" + infuraProjectId,
  "kovan"
);*/

const provider = new ethers.providers.JsonRpcProvider(
  "https://polygon-mumbai.infura.io/v3/" + infuraProjectId
);

const wallet = new ethers.Wallet(privateKey, provider);

let test = async (args) => {
  const networkId = await provider.send("net_version", []);
  console.log("networkID = " + networkId);

  const addr = boardJSON.networks[networkId].address;
  console.log(addr);

  const instance = new ethers.Contract(addr, boardJSON.abi, wallet);
  console.log("instance ok");

  let val = await instance.getNbLands(0);
  console.log("Get Nb Lands = " + val);

  instance.on("ePawn", async function (edition, pawnID, event) {
    console.log(
      "ePawn registered event: edition = " + edition + " pawnID = " + pawnID
    );
  });

  instance.on("RandomReady", async function (requestId, event) {
    console.log("RandomReady event: requestId = " + requestId);
    let p = await instance.getPawn(0, args[0]);
    console.log("Pawn Info =" + p);
  });

  console.log("Register");
  let tx = await instance.register(0, args[0]);
  await tx.wait();

  console.log("Play");
  tx = await instance.play(0, args[0]);
  await tx.wait();
};

const args = process.argv.slice(2);
test(args);
