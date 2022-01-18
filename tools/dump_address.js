const monoJSON = require("../client/src/contracts/MonoContract.json");
const pawnJSON = require("../client/src/contracts/PawnContract.json");
const boardJSON = require("../client/src/contracts/BoardContract.json");
const propJSON = require("../client/src/contracts/PropContract.json");
const buildJSON = require("../client/src/contracts/BuildContract.json");
const BankJSON = require("../client/src/contracts/BankContract.json");
const StakingJSON = require("../client/src/contracts/StakingContract.json");

const args = process.argv.slice(2);
let networkId = args[0];

console.log("MONO => " + monoJSON.networks[networkId].address);
console.log("BOARD => " + boardJSON.networks[networkId].address);
console.log("PAWN => " + pawnJSON.networks[networkId].address);
console.log("PROP => " + propJSON.networks[networkId].address);
console.log("BUILD => " + buildJSON.networks[networkId].address);
console.log("BANK => " + BankJSON.networks[networkId].address);
console.log("STAKING => " + StakingJSON.networks[networkId].address);
