// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IOracle {
    // returns the price of the token in ETH
    function getTokenPriceInEth(address token) external view returns (uint256 priceInEth);
}
