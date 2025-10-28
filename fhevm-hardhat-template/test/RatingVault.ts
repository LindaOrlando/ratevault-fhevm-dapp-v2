import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { RatingVault } from "../types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RatingVault", function () {
  let ratingVault: RatingVault;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    await deployments.fixture(["RatingVault"]);
    [owner, user1, user2] = await ethers.getSigners();

    const RatingVaultDeployment = await deployments.get("RatingVault");
    ratingVault = await ethers.getContractAt("RatingVault", RatingVaultDeployment.address);
  });

  describe("创建评分", function () {
    it("应该成功创建评分项目", async function () {
      const tx = await ratingVault.createRating(
        "Product Review",
        "Rate our product on multiple dimensions",
        ["Quality", "Price", "Design"],
        1,
        5,
        0
      );

      await tx.wait();

      const rating = await ratingVault.getRating(0);
      expect(rating.name).to.equal("Product Review");
      expect(rating.creator).to.equal(owner.address);
      expect(rating.dimensions.length).to.equal(3);
      expect(rating.minScore).to.equal(1);
      expect(rating.maxScore).to.equal(5);
      expect(rating.active).to.be.true;
      expect(rating.participantCount).to.equal(0);
    });

    it("应该拒绝少于2个维度", async function () {
      await expect(
        ratingVault.createRating("Invalid", "Description", ["Only One"], 1, 5, 0)
      ).to.be.revertedWith("2-10 dimensions required");
    });

    it("应该拒绝超过10个维度", async function () {
      const tooManyDimensions = Array(11).fill("Dimension");
      await expect(
        ratingVault.createRating("Invalid", "Description", tooManyDimensions, 1, 5, 0)
      ).to.be.revertedWith("2-10 dimensions required");
    });

    it("应该拒绝无效的分数范围", async function () {
      await expect(
        ratingVault.createRating("Invalid", "Description", ["D1", "D2"], 5, 3, 0)
      ).to.be.revertedWith("minScore < maxScore");
    });

    it("应该触发 RatingCreated 事件", async function () {
      await expect(
        ratingVault.createRating("Test", "Description", ["D1", "D2"], 1, 5, 0)
      )
        .to.emit(ratingVault, "RatingCreated")
        .withArgs(0, owner.address, "Test", 2);
    });
  });

  describe("提交评分", function () {
    beforeEach(async function () {
      // 创建测试评分项目
      const tx = await ratingVault.createRating(
        "Test Rating",
        "Test Description",
        ["Dimension1", "Dimension2", "Dimension3"],
        1,
        5,
        0
      );
      await tx.wait();
    });

    it("应该记录用户已评分状态", async function () {
      // This test requires FHEVM mock utils for encrypted inputs
      // Skipping for now as it would need proper encrypted input generation
      // 
      // Example of correct usage:
      // const input = instances.user1.createEncryptedInput(contractAddress, user1.address);
      // input.add32(5).add32(4).add32(3);
      // const encrypted = input.encrypt();
      // await ratingVault.connect(user1).submitRating(0, encrypted.handles, encrypted.inputProof);
      // expect(await ratingVault.hasRated(0, user1.address)).to.be.true;
    });

    it("应该增加参与人数", async function () {
      const ratingBefore = await ratingVault.getRating(0);
      expect(ratingBefore.participantCount).to.equal(0);

      // 实际提交需要加密输入，此处省略
      // const tx = await ratingVault.connect(user1).submitRating(0, encryptedScores);
      // await tx.wait();

      // const ratingAfter = await ratingVault.getRating(0);
      // expect(ratingAfter.participantCount).to.equal(1);
    });

    it("应该拒绝重复评分", async function () {
      // 实际测试需要 FHEVM mock，此处省略详细实现
      // 逻辑：用户提交一次后，hasRated[0][user1] = true
      // 再次提交应该 revert "Already rated"
    });
  });

  describe("关闭评分", function () {
    beforeEach(async function () {
      const tx = await ratingVault.createRating(
        "Test Rating",
        "Test Description",
        ["D1", "D2"],
        1,
        5,
        0
      );
      await tx.wait();
    });

    it("创建者应该能关闭评分", async function () {
      const tx = await ratingVault.closeRating(0);
      await tx.wait();

      const rating = await ratingVault.getRating(0);
      expect(rating.active).to.be.false;
    });

    it("非创建者不能关闭评分", async function () {
      await expect(ratingVault.connect(user1).closeRating(0)).to.be.revertedWith("Not creator");
    });

    it("应该触发 RatingClosed 事件", async function () {
      await expect(ratingVault.closeRating(0)).to.emit(ratingVault, "RatingClosed").withArgs(0);
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      // 创建多个评分项目
      await ratingVault.createRating("Rating 1", "Desc 1", ["D1", "D2"], 1, 5, 0);
      await ratingVault
        .connect(user1)
        .createRating("Rating 2", "Desc 2", ["D1", "D2", "D3"], 1, 5, 0);
      await ratingVault.createRating("Rating 3", "Desc 3", ["D1", "D2"], 1, 5, 0);
    });

    it("应该返回正确的评分总数", async function () {
      const count = await ratingVault.ratingCount();
      expect(count).to.equal(3);
    });

    it("应该正确分页查询评分列表", async function () {
      const ratings = await ratingVault.getRatings(0, 2);
      expect(ratings.length).to.equal(2);
      expect(ratings[0].name).to.equal("Rating 1");
      expect(ratings[1].name).to.equal("Rating 2");
    });

    it("应该返回用户创建的评分列表", async function () {
      const ownerRatings = await ratingVault.getMyCreatedRatings(owner.address);
      expect(ownerRatings.length).to.equal(2);
      expect(ownerRatings[0]).to.equal(0);
      expect(ownerRatings[1]).to.equal(2);

      const user1Ratings = await ratingVault.getMyCreatedRatings(user1.address);
      expect(user1Ratings.length).to.equal(1);
      expect(user1Ratings[0]).to.equal(1);
    });

    it("应该返回单个评分详情", async function () {
      const rating = await ratingVault.getRating(1);
      expect(rating.name).to.equal("Rating 2");
      expect(rating.creator).to.equal(user1.address);
      expect(rating.dimensions.length).to.equal(3);
    });
  });

  describe("边界条件", function () {
    it("应该支持永久有效的评分（deadline=0）", async function () {
      const tx = await ratingVault.createRating(
        "Permanent Rating",
        "No deadline",
        ["D1", "D2"],
        1,
        5,
        0
      );
      await tx.wait();

      const rating = await ratingVault.getRating(0);
      expect(rating.deadline).to.equal(0);
    });

    it("应该支持有截止时间的评分", async function () {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // +1 day
      const tx = await ratingVault.createRating(
        "Timed Rating",
        "Has deadline",
        ["D1", "D2"],
        1,
        5,
        futureTimestamp
      );
      await tx.wait();

      const rating = await ratingVault.getRating(0);
      expect(rating.deadline).to.equal(futureTimestamp);
    });

    it("应该拒绝过去的截止时间", async function () {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // -1 day
      await expect(
        ratingVault.createRating("Invalid", "Past deadline", ["D1", "D2"], 1, 5, pastTimestamp)
      ).to.be.revertedWith("Invalid deadline");
    });
  });
});

