// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RovaExecutionLog
/// @notice Onchain audit trail for Rova's autonomous Agent. Every time an
///         armed rule fires (a StableFX rate condition or deadline is met
///         and Rova executes a transfer without a human clicking "send"),
///         the agent writes a record here. This is the real settlement of
///         what Rova calls an "Arc Transaction Memo" on an autonomous run —
///         a permanent, publicly verifiable reason attached to the tx.
/// @dev    Gated with ownership so only the authorized Rova agent owner
///         or executor wallet can record autonomous runs.
contract RovaExecutionLog {
    address public owner;

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
        address indexed executor, // Indexed for easy filtering
        uint256 amountUsdc6,
        uint256 rateAtExecution1e6,
        string memo,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    Execution[] private executions;

    modifier onlyOwner() {
        require(msg.sender == owner, "RovaExecutionLog: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RovaExecutionLog: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Records one autonomous execution. Callable only by the owner/executor.
    function logExecution(
        bytes32 ruleId,
        address recipient,
        uint256 amountUsdc6,
        uint256 rateAtExecution1e6,
        string calldata memo
    ) external onlyOwner returns (uint256 executionId) {
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
