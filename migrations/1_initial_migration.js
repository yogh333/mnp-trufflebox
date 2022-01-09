require("dotenv").config();

const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  /*if (process.env.IS_SETUP) {
    return;
  }*/

  deployer.deploy(Migrations);
};
