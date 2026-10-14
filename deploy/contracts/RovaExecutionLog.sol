// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RovaExecutionLog
/// @notice Public, non-custodial audit metadata. This contract never moves funds.

contract RovaExecutionLog {
    struct Execution {
        bytes32 ruleId;         // off-chain rule id (hash), links back to the Agent's rule store
        address executor;       // caller that submitted the audit entry
        address recipient;      // related recipient, or zero address for a non-financial entry
        uint256 amountUsdc6;    // declared USDC amount in 6-decimal units; zero is allowed
        uint256 rateAtExecution1e6; // declared FX rate scaled by 1e6; zero is allowed
        string  memo;           // human-readable audit metadata
        uint256 timestamp;
    }

    event ExecutionLogged(
        uint256 indexed executionId,
        bytes32 indexed ruleId,
        address indexed recipient,
        address executor,
        uint256 amountUsdc6,
        uint256 rateAtExecution1e6,
        string memo,
        uint256 timestamp
    );

    Execution[] private executions;

    /// @notice Records one public audit entry. Callable by anyone by design.
    ///         Entries are caller-submitted metadata, not verified proof of a
    ///         transfer. Consumers must independently verify any related action.
    function logExecution(
        bytes32 ruleId,
        address recipient,
        uint256 amountUsdc6,
        uint256 rateAtExecution1e6,
        string calldata memo
    ) external returns (uint256 executionId) {
        executionId = executions.length;
        executions.push(Execution({
            ruleId: ruleId,
            executor: msg.sender,
            recipient: recipient,
            amountUsdc6: amountUsdc6,
            rateAtExecution1e6: rateAtExecution1e6,
            memo: memo,
            timestamp: block.timestamp
        }));

        emit ExecutionLogged(
            executionId,
            ruleId,
            recipient,
            msg.sender,
            amountUsdc6,
            rateAtExecution1e6,
            memo,
            block.timestamp
        );
    }

    function getExecution(uint256 executionId) external view returns (Execution memory) {
        return executions[executionId];
    }

    function totalExecutions() external view returns (uint256) {
        return executions.length;
    }
}
