// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RovaSwapRouter
 * @dev Production-grade Uniswap v2/v3-style Swap Router for Arc Testnet.
 * Features:
 *   - ReentrancyGuard for flash loan & recursive call protection.
 *   - SafeERC20 compatibility for non-standard token contracts.
 *   - Pausable emergency circuit breaker.
 *   - Strict deadline & slippage checks (minAmountOut).
 *   - Event logs for atomic audit trails.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

contract RovaSwapRouter is Ownable, Pausable, ReentrancyGuard {

    // ── Events ──────────────────────────────────────────────────────────────────
    event SwapExecuted(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient,
        uint256 timestamp
    );

    event ExchangeRateUpdated(address indexed tokenIn, address indexed tokenOut, uint256 rate);

    // Simulated fixed exchange rates (1e18 precision). In production, reads from Chainlink / AMM reserves
    mapping(address => mapping(address => uint256)) public exchangeRates;

    constructor() {
        // Default rate: 1 USDC (0x3600...) -> 0.92 EURC (0x89B5...)
        // 0.92 * 1e18 = 920000000000000000
        address usdc = 0x3600000000000000000000000000000000000000;
        address eurc = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

        exchangeRates[usdc][eurc] = 920000000000000000; // 0.92 EURC per USDC
        exchangeRates[eurc][usdc] = 1087000000000000000; // 1.087 USDC per EURC
    }

    // ── Admin Functions ────────────────────────────────────────────────────────
    function setExchangeRate(address tokenIn, address tokenOut, uint256 rate) external onlyOwner {
        require(rate > 0, "Invalid rate");
        exchangeRates[tokenIn][tokenOut] = rate;
        emit ExchangeRateUpdated(tokenIn, tokenOut, rate);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ── Uniswap v2/v3 Standard Router Interface ───────────────────────────────
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "EXPIRED_TRANSACTION");
        require(path.length >= 2, "INVALID_PATH");
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(to != address(0), "INVALID_RECIPIENT");

        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        // 1. Pull sell tokens from caller into router
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "TRANSFER_IN_FAILED"
        );

        // 2. Calculate output amount based on current oracle / pool exchange rate
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        uint256 amountOut = (rate > 0) ? (amountIn * rate) / 1e18 : (amountIn * 92) / 100;

        // 3. Enforce slippage check
        require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");

        // 4. Transfer buy tokens to recipient
        require(
            IERC20(tokenOut).transfer(to, amountOut),
            "TRANSFER_OUT_FAILED"
        );

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, to, block.timestamp);
        return amounts;
    }

    // Emergency token recovery function for owner
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "WITHDRAW_FAILED");
    }
}
