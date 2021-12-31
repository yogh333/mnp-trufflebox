// PropertyRoyalties.test.js

Paris = require("../client/src/data/Paris.json");

const Prop = artifacts.require("PropContract");
const PawnStub = artifacts.require("PawnStub");
const BoardStub = artifacts.require("BoardStub");

const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");
const { BN } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

contract("Property royalties", async (accounts) => {
  const _contractOwner = accounts[0];
  const _seller = accounts[1];
  const _buyer = accounts[2];
  const NOT_ALLOWED_ADDRESS = accounts[3];

  const BANK_INSTANCE_ADDRESS = accounts[8];
  const OPENSEA_PROXY_ADDRESS = accounts[9];

  const INTERFACE_ID_ERC2981 = "0x2a55205a";

  let PropInstance;
  let PawnInstance;
  let BoardInstance;

  let royaltiesPercentageBasisPoints = 500; // i.e. 5%

  let ADMIN_ROLE;
  let MINTER_ROLE;

  const etherToWei = (ethers) => {
    return web3.utils.toWei(ethers.toString(), "ether");
  };

  const initialSetUp = async () => {
    PawnInstance = await PawnStub.new({ from: _contractOwner });
    BoardInstance = await BoardStub.new(PawnInstance.address, {
      from: _contractOwner,
    });
    PropInstance = await Prop.new(
      BoardInstance.address,
      "Property",
      "PROP",
      "https://server.com/prop/",
      { from: _contractOwner }
    );

    // Mint one prop for Seller
    await PropInstance.mint(_seller, 0, 1, 2, {
      from: _contractOwner,
    });

    ADMIN_ROLE = await PropInstance.ADMIN_ROLE();
    MINTER_ROLE = await PropInstance.MINTER_ROLE();
  };

  describe("Initial State", () => {
    before("SETUP", async () => {
      await initialSetUp();
    });
    it("Contract owner's roles are corrects", async () => {
      const contractOwner = await PropInstance.owner();
      assert.strictEqual(contractOwner, _contractOwner);
      let hasRole = await PropInstance.hasRole(ADMIN_ROLE, _contractOwner);
      assert.isTrue(hasRole);
      hasRole = await PropInstance.hasRole(MINTER_ROLE, _contractOwner);
      assert.isTrue(hasRole);
    });
    it("Support special interfaces", async () => {
      let isSupported = await PropInstance.supportsInterface(
        INTERFACE_ID_ERC2981
      );
      assert.isTrue(isSupported);
    });
    it("Max tokens for seller", async () => {
      const balance = await PropInstance.balanceOf(_seller);
      assert.strictEqual(balance.toNumber(), 1);
    });
    it("royalties information for minted property", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      const royaltyInfo = await PropInstance.royaltyInfo(tokenId, 1000);
      assert.strictEqual(royaltyInfo.receiver, _contractOwner);
      assert.strictEqual(royaltyInfo.royaltyAmount.toNumber(), 50);
    });
  });

  describe("#setIsOperatorAllowed()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
    });
    it("Allow / Disallow", async () => {
      // Initial state
      let isAllowed = await PropInstance.isOperatorAllowed(
        BANK_INSTANCE_ADDRESS
      );
      assert.isFalse(isAllowed);

      // Allow
      await PropInstance.setIsOperatorAllowed(BANK_INSTANCE_ADDRESS, true);
      isAllowed = await PropInstance.isOperatorAllowed(BANK_INSTANCE_ADDRESS);
      assert.isTrue(isAllowed);

      // Disallow
      await PropInstance.setIsOperatorAllowed(BANK_INSTANCE_ADDRESS, false);
      isAllowed = await PropInstance.isOperatorAllowed(BANK_INSTANCE_ADDRESS);
      assert.isFalse(isAllowed);
    });
  });

  const allowOperators = async () => {
    await PropInstance.setIsOperatorAllowed(BANK_INSTANCE_ADDRESS, true);
    await PropInstance.setIsOperatorAllowed(OPENSEA_PROXY_ADDRESS, true);
  };

  describe("#isApprovedForAll()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
      await allowOperators();
    });
    it("Allowed addresses", async () => {
      let isApprovedForAll = await PropInstance.isApprovedForAll(
        _seller,
        BANK_INSTANCE_ADDRESS
      );
      assert.isTrue(isApprovedForAll);
      isApprovedForAll = await PropInstance.isApprovedForAll(
        _seller,
        OPENSEA_PROXY_ADDRESS
      );
      assert.isTrue(isApprovedForAll);
    });
    it("Not allowed addresses", async () => {
      const isApprovedForAll = await PropInstance.isApprovedForAll(
        _seller,
        NOT_ALLOWED_ADDRESS
      );
      assert.isFalse(isApprovedForAll);
    });
  });

  describe("#setDefaultRoyaltyPercentageBasisPoints()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
    });
    it("Works as expected", async () => {
      let value = await PropInstance.defaultRoyaltyPercentageBasisPoints();
      assert.strictEqual(value.toNumber(), 500);

      await PropInstance.setDefaultRoyaltyPercentageBasisPoints(1000);
      value = await PropInstance.defaultRoyaltyPercentageBasisPoints();
      assert.strictEqual(value.toNumber(), 1000);
    });
  });

  describe("#setRoyalties()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
    });
    it("Only admin role", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await truffleAssert.reverts(
        PropInstance.setRoyalties(tokenId, 600, {
          from: _seller,
        })
      );
    });
    it("value has changed as expected", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      let result = await PropInstance.setRoyalties(tokenId, 600, {
        from: _contractOwner,
      });

      result = await truffleAssert.createTransactionResult(
        PropInstance,
        result.tx
      );
      truffleAssert.eventEmitted(result, "RoyaltySet");

      const royaltyInfo = await PropInstance.royaltyInfo(tokenId, 1000);
      assert.strictEqual(royaltyInfo.receiver, _contractOwner);
      assert.strictEqual(royaltyInfo.royaltyAmount.toNumber(), 60);
    });
  });

  // todo test with a contrat receiver stub with implement or not {IERC721Receiver-onERC721Received}
  describe("#safeTransferFrom() & #_isApprovedOrOwner()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
      await allowOperators();
    });
    it("NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await truffleAssert.reverts(
        PropInstance.safeTransferFrom(_seller, _buyer, tokenId, {
          from: _seller,
        })
      );
    });
    it("Address approved by NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await PropInstance.approve(NOT_ALLOWED_ADDRESS, tokenId, {
        from: _seller,
      });
      await truffleAssert.reverts(
        PropInstance.safeTransferFrom(_seller, _buyer, tokenId, {
          from: NOT_ALLOWED_ADDRESS,
        })
      );
    });
    it("Address set approved for all by NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await PropInstance.setApprovalForAll(NOT_ALLOWED_ADDRESS, tokenId, {
        from: _seller,
      });
      await truffleAssert.reverts(
        PropInstance.safeTransferFrom(_seller, _buyer, tokenId, {
          from: NOT_ALLOWED_ADDRESS,
        })
      );
    });
    it("Opensea operator can", async () => {
      const owner = _seller;
      const tokenId = await PropInstance.tokenOfOwnerByIndex(owner, 0);
      await PropInstance.safeTransferFrom(owner, _buyer, tokenId, {
        from: OPENSEA_PROXY_ADDRESS,
      });
    });
    it("Bank contract operator can", async () => {
      const newOwner = _buyer;
      const newBuyer = _seller;
      const tokenId = await PropInstance.tokenOfOwnerByIndex(newOwner, 0);
      await PropInstance.safeTransferFrom(newOwner, newBuyer, tokenId, {
        from: BANK_INSTANCE_ADDRESS,
      });
    });
  });

  describe("#transferFrom()", async () => {
    before("SETUP", async () => {
      await initialSetUp();
      await allowOperators();
    });
    it("NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await truffleAssert.reverts(
        PropInstance.transferFrom(_seller, _buyer, tokenId, {
          from: _seller,
        })
      );
    });
    it("Address approved by NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await PropInstance.approve(NOT_ALLOWED_ADDRESS, tokenId, {
        from: _seller,
      });
      await truffleAssert.reverts(
        PropInstance.transferFrom(_seller, _buyer, tokenId, {
          from: NOT_ALLOWED_ADDRESS,
        })
      );
    });
    it("Address set approved for all by NFT owner can't", async () => {
      const tokenId = await PropInstance.tokenOfOwnerByIndex(_seller, 0);
      await PropInstance.setApprovalForAll(NOT_ALLOWED_ADDRESS, tokenId, {
        from: _seller,
      });
      await truffleAssert.reverts(
        PropInstance.transferFrom(_seller, _buyer, tokenId, {
          from: NOT_ALLOWED_ADDRESS,
        })
      );
    });
    it("Opensea operator can", async () => {
      const owner = _seller;
      const tokenId = await PropInstance.tokenOfOwnerByIndex(owner, 0);
      await PropInstance.transferFrom(owner, _buyer, tokenId, {
        from: OPENSEA_PROXY_ADDRESS,
      });
    });
    it("Bank contract operator can", async () => {
      const newOwner = _buyer;
      const newBuyer = _seller;
      const tokenId = await PropInstance.tokenOfOwnerByIndex(newOwner, 0);
      await PropInstance.transferFrom(newOwner, newBuyer, tokenId, {
        from: BANK_INSTANCE_ADDRESS,
      });
    });
  });
});
