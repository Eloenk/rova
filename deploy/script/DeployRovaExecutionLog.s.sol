// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/RovaExecutionLog.sol";

contract DeployRovaExecutionLog is Script {
    function run() external returns (RovaExecutionLog executionLog) {
        uint256 deployerPrivateKey = vm.envUint("ROVA_DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        executionLog = new RovaExecutionLog();

        console.log("RovaExecutionLog deployed to:", address(executionLog));

        vm.stopBroadcast();
    }
}
