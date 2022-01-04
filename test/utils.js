const utils = {
  isEVMException(err) {
    return err.toString().includes("revert");
  },
};

module.exports = utils;
