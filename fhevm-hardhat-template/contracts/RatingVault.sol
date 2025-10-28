// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RatingVault - Privacy-First Multi-Dimensional Rating Platform
/// @notice 基于 FHEVM 的隐私评分 dApp，支持多维度加密评分
/// @dev 所有评分数据使用 FHEVM 加密类型存储，仅创建者可解密统计结果
contract RatingVault is SepoliaConfig {
    /// @notice 评分项目结构
    struct Rating {
        uint256 id;
        address creator;
        string name;
        string description;
        string[] dimensions; // 维度名称数组
        uint8 minScore;
        uint8 maxScore;
        uint256 deadline; // 0 表示永久有效
        bool active;
        uint256 participantCount;
        uint256 createdAt;
    }

    /// @notice 用户评分结构（加密）
    struct UserRating {
        euint32[] scores; // 加密分数数组，对应各维度
        uint256 timestamp;
    }

    /// @notice 评分项目总数
    uint256 public ratingCount;

    /// @notice 评分项目映射
    mapping(uint256 => Rating) public ratings;

    /// @notice 用户评分映射 ratingId => user => UserRating
    mapping(uint256 => mapping(address => UserRating)) private userRatings;

    /// @notice 是否已评分 ratingId => user => bool
    mapping(uint256 => mapping(address => bool)) public hasRated;

    /// @notice 累计加密分数 ratingId => dimension index => aggregated euint32
    mapping(uint256 => euint32[]) private aggregatedScores;

    /// @notice 用户参与的评分列表
    mapping(address => uint256[]) private userRatedRatings;

    /// @notice 用户创建的评分列表
    mapping(address => uint256[]) private userCreatedRatings;

    /// @notice 评分创建事件
    event RatingCreated(
        uint256 indexed ratingId,
        address indexed creator,
        string name,
        uint256 dimensionCount
    );

    /// @notice 评分提交事件
    event RatingSubmitted(uint256 indexed ratingId, address indexed participant);

    /// @notice 评分关闭事件
    event RatingClosed(uint256 indexed ratingId);

    /// @notice 仅创建者修饰符
    modifier onlyCreator(uint256 ratingId) {
        require(ratings[ratingId].creator == msg.sender, "Not creator");
        _;
    }

    /// @notice 评分活跃修饰符
    modifier ratingActive(uint256 ratingId) {
        require(ratings[ratingId].active, "Rating closed");
        require(
            ratings[ratingId].deadline == 0 || block.timestamp <= ratings[ratingId].deadline,
            "Rating expired"
        );
        _;
    }

    /// @notice 未评分修饰符
    modifier notRatedYet(uint256 ratingId) {
        require(!hasRated[ratingId][msg.sender], "Already rated");
        _;
    }

    /// @notice 创建评分项目
    /// @param name 评分项目名称
    /// @param description 评分项目描述
    /// @param dimensions 维度名称数组（2-10个）
    /// @param minScore 最小分数（1-10）
    /// @param maxScore 最大分数（1-10）
    /// @param deadline 截止时间（0表示永久有效）
    /// @return ratingId 新创建的评分项目ID
    function createRating(
        string memory name,
        string memory description,
        string[] memory dimensions,
        uint8 minScore,
        uint8 maxScore,
        uint256 deadline
    ) external returns (uint256 ratingId) {
        require(bytes(name).length > 0, "Name required");
        require(dimensions.length >= 2 && dimensions.length <= 10, "2-10 dimensions required");
        require(minScore >= 1 && maxScore <= 10, "Score range 1-10");
        require(minScore < maxScore, "minScore < maxScore");
        require(deadline == 0 || deadline > block.timestamp, "Invalid deadline");

        ratingId = ratingCount++;

        ratings[ratingId] = Rating({
            id: ratingId,
            creator: msg.sender,
            name: name,
            description: description,
            dimensions: dimensions,
            minScore: minScore,
            maxScore: maxScore,
            deadline: deadline,
            active: true,
            participantCount: 0,
            createdAt: block.timestamp
        });

        // 初始化累计分数数组（每个维度一个）
        for (uint256 i = 0; i < dimensions.length; i++) {
            euint32 initialScore = FHE.asEuint32(0);
            FHE.allowThis(initialScore);  // 授权合约访问初始值
            FHE.allow(initialScore, msg.sender);  // 授权创建者解密聚合分数
            aggregatedScores[ratingId].push(initialScore);
        }

        userCreatedRatings[msg.sender].push(ratingId);

        emit RatingCreated(ratingId, msg.sender, name, dimensions.length);
    }

    /// @notice 提交评分（加密）
    /// @param ratingId 评分项目ID
    /// @param encryptedInputs 加密的分数数组（externalEuint32格式）
    /// @param inputProof 输入证明
    function submitRating(
        uint256 ratingId,
        externalEuint32[] calldata encryptedInputs,
        bytes calldata inputProof
    ) external ratingActive(ratingId) notRatedYet(ratingId) {
        Rating storage rating = ratings[ratingId];
        require(encryptedInputs.length == rating.dimensions.length, "Dimension mismatch");

        // 转换并存储加密分数
        euint32[] storage userScores = userRatings[ratingId][msg.sender].scores;
        for (uint256 i = 0; i < encryptedInputs.length; i++) {
            euint32 score = FHE.fromExternal(encryptedInputs[i], inputProof);
            userScores.push(score);

            // 累加到总分（FHE 加法）
            euint32 newAggregated = FHE.add(aggregatedScores[ratingId][i], score);
            aggregatedScores[ratingId][i] = newAggregated;

            // 授权用户解密自己的分数
            FHE.allow(score, msg.sender);
            // 授权合约自身访问（用于统计）
            FHE.allowThis(score);
            // 授权合约访问累加后的值
            FHE.allowThis(newAggregated);
            // 授权创建者解密聚合分数
            FHE.allow(newAggregated, rating.creator);
        }

        userRatings[ratingId][msg.sender].timestamp = block.timestamp;
        hasRated[ratingId][msg.sender] = true;
        rating.participantCount++;

        userRatedRatings[msg.sender].push(ratingId);

        emit RatingSubmitted(ratingId, msg.sender);
    }

    /// @notice 关闭评分（仅创建者）
    /// @param ratingId 评分项目ID
    function closeRating(uint256 ratingId) external onlyCreator(ratingId) {
        require(ratings[ratingId].active, "Already closed");
        ratings[ratingId].active = false;
        emit RatingClosed(ratingId);
    }

    /// @notice 获取用户自己的加密评分（用于前端解密）
    /// @param ratingId 评分项目ID
    /// @return scores 加密分数数组
    function getMyRating(uint256 ratingId) external view returns (euint32[] memory scores) {
        require(hasRated[ratingId][msg.sender], "Not rated yet");
        return userRatings[ratingId][msg.sender].scores;
    }

    /// @notice 获取评分项目详情
    /// @param ratingId 评分项目ID
    /// @return rating 评分项目结构
    function getRating(uint256 ratingId) external view returns (Rating memory rating) {
        return ratings[ratingId];
    }

    /// @notice 获取评分项目列表（分页）
    /// @param offset 偏移量
    /// @param limit 限制数量
    /// @return result 评分项目数组
    function getRatings(uint256 offset, uint256 limit)
        external
        view
        returns (Rating[] memory result)
    {
        if (offset >= ratingCount) {
            return new Rating[](0);
        }

        uint256 end = offset + limit;
        if (end > ratingCount) {
            end = ratingCount;
        }

        uint256 resultLength = end - offset;
        result = new Rating[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = ratings[offset + i];
        }

        return result;
    }

    /// @notice 获取用户参与的评分ID列表
    /// @param user 用户地址
    /// @return ratingIds 评分ID数组
    function getMyRatedRatings(address user) external view returns (uint256[] memory ratingIds) {
        return userRatedRatings[user];
    }

    /// @notice 获取用户创建的评分ID列表
    /// @param user 用户地址
    /// @return ratingIds 评分ID数组
    function getMyCreatedRatings(address user) external view returns (uint256[] memory ratingIds) {
        return userCreatedRatings[user];
    }

    /// @notice 获取累计加密分数（仅创建者，用于解密统计）
    /// @param ratingId 评分项目ID
    /// @return scores 累计加密分数数组
    function getAggregatedScores(uint256 ratingId)
        external
        view
        onlyCreator(ratingId)
        returns (euint32[] memory scores)
    {
        return aggregatedScores[ratingId];
    }

    /// @notice 授权创建者解密累计分数
    /// @param ratingId 评分项目ID
    function allowCreatorDecryption(uint256 ratingId) external onlyCreator(ratingId) {
        euint32[] storage scores = aggregatedScores[ratingId];
        for (uint256 i = 0; i < scores.length; i++) {
            FHE.allow(scores[i], msg.sender);
        }
    }
}

