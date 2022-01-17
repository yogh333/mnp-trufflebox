const { ethers } = require("ethers");

require("dotenv").config();

const privateKey = process.env["PRIVATE_KEY"];

const boardJSON = require("../client/src/contracts/BoardContract.json");
const bankJSON = require("../client/src/contracts/BankContract.json");
const monoJSON = require("../client/src/contracts/MonoContract.json");

const { isEVMException } = require("../test/utils");

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(privateKey, provider);

let test = async (args) => {
  const networkId = await provider.send("net_version", []);
  console.log("networkID = " + networkId);

  const boardADDR = boardJSON.networks[networkId].address;
  console.log(boardADDR);
  const boardINST = new ethers.Contract(boardADDR, boardJSON.abi, wallet);
  console.log("Board instance ok");

  const bankADDR = bankJSON.networks[networkId].address;
  console.log(bankADDR);
  const bankINST = new ethers.Contract(bankADDR, bankJSON.abi, wallet);
  console.log("Bank instance ok");

  const monoADDR = monoJSON.networks[networkId].address;
  console.log(monoADDR);
  const monoINST = new ethers.Contract(monoADDR, monoJSON.abi, wallet);
  console.log("Mono instance ok");

  console.log("Get $MONO balance of " + wallet.address);
  let balance = await monoINST.balanceOf(wallet.address);
  console.log(ethers.utils.formatEther(balance));

  await monoINST.approve(bankINST.address, balance.toString());

  console.log("Buy Pawn");
  start = Date.now();

  bankINST.on("PawnBought", async function (owner, pawnID, event) {
    end = Date.now();
    console.log(
      "PawnBought event received in " +
        (end - start) +
        "ms : owner = " +
        owner +
        " pawnID = " +
        pawnID
    );
  });

  let tx = await bankINST.buyPawn();
  await tx.wait();
};

const args = process.argv.slice(2);
test(args);
