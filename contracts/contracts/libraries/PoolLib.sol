// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

    struct Pool {
        address token;
        address oracle;
        // the pool fee is expressed in basis points (bps)
        // i.e: 100 bps = 1%
        //
        // to be done: the pool fee should be a relationship between the token reserves and the eth reserves.
        // A kind of bounding curve must be implemented where:
        // When ethReserves are zero, the fee is maximum (e.g 5%)
        // When tokenReserves are zero, the fee is minimum (e.g 0.1%)
        //
        uint24 rebalancingFeeBps;
        // the pool LP fee is expressed in basis points (bps)
        // i.e: 100 bps = 1%
        uint24 lpFeeBps;
    }