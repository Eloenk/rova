// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error RouterDeprecated();

contract RovaSwapRouter {
    function swapExactTokensForTokens(
        uint256,
        uint256,
        address[] calldata,
        address,
        uint256
    ) external pure returns (uint256[] memory) {
        revert RouterDeprecated();
    }
}
