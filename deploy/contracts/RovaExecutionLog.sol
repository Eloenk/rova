// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RovaExecutionLog

contract RovaExecutionLog {
    struct Execution {
        bytes32 ruleId;         // off-chain rule id (hash), links back to the Agent's rule store
        address executor;       // wallet that carried out the transfer (the agent's operating wallet)
        address recipient;      // who received funds
        uint256 amountUsdc6;    // amount in USDC's 6-decimal base units
        uint256 rateAtExecution1e6; // FX rate at execution time, scaled by 1e6 for precision without floats
        string  memo;           // human-readable reason, e.g. "auto-exec: rate 0.930000 >= target 0.930000"
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

    /// @notice Records one autonomous execution. Callable by anyone by design —
    ///         this is a public log, not a gated escrow. The trust anchor is
    ///         that the `executor` field and the actual onchain transfer tx
    ///         can be cross-checked against each other; this contract doesn't
    ///         move funds itself, it only attests to why a transfer happened.
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
