// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

interface IGame {
    function getLifetimeScore(address player) external view returns (uint256);
}