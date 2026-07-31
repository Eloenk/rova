// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
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

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
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

abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
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

contract RovaSavingsVault is Ownable, ReentrancyGuard, Pausable {

    struct SavingsDeposit {
        uint256 depositId;
        address user;
        address tokenAddress;
        uint256 amount;
        uint256 depositedAt;
        uint256 lockUntil;
        bool redeemed;
    }

    uint256 public nextDepositId = 1;
    mapping(uint256 => SavingsDeposit) public deposits;
    mapping(address => uint256[]) private userDepositIds;
    mapping(address => mapping(address => uint256)) public userTotalSaved;

    event SavingsDeposited(
        uint256 indexed depositId,
        address indexed user,
        address indexed tokenAddress,
        uint256 amount,
        uint256 lockUntil
    );

    event SavingsRedeemed(
        uint256 indexed depositId,
        address indexed user,
        address indexed tokenAddress,
        uint256 amount
    );

    event EmergencyUnlocked(uint256 indexed depositId, address indexed user, uint256 amount);

    constructor() {}

    function depositSavings(
        address token,
        uint256 amount,
        uint256 lockDurationSeconds
    ) external whenNotPaused nonReentrant returns (uint256 depositId) {
        require(token != address(0), "RovaVault: Invalid token address");
        require(amount > 0, "RovaVault: Amount must be greater than zero");

        uint256 lockUntil = block.timestamp + lockDurationSeconds;
        depositId = nextDepositId++;

        deposits[depositId] = SavingsDeposit({
            depositId: depositId,
            user: msg.sender,
            tokenAddress: token,
            amount: amount,
            depositedAt: block.timestamp,
            lockUntil: lockUntil,
            redeemed: false
        });

        userDepositIds[msg.sender].push(depositId);
        userTotalSaved[msg.sender][token] += amount;

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "RovaVault: ERC20 transferFrom failed");

        emit SavingsDeposited(depositId, msg.sender, token, amount, lockUntil);
    }

    function redeemSavings(uint256 depositId) external whenNotPaused nonReentrant {
        SavingsDeposit storage dep = deposits[depositId];
        require(dep.user == msg.sender, "RovaVault: Caller is not deposit owner");
        require(!dep.redeemed, "RovaVault: Deposit already redeemed");
        require(block.timestamp >= dep.lockUntil, "RovaVault: Deposit is still timelocked");

        dep.redeemed = true;
        userTotalSaved[msg.sender][dep.tokenAddress] -= dep.amount;

        bool success = IERC20(dep.tokenAddress).transfer(msg.sender, dep.amount);
        require(success, "RovaVault: ERC20 transfer failed");

        emit SavingsRedeemed(depositId, msg.sender, dep.tokenAddress, dep.amount);
    }

    function getUserDepositIds(address user) external view returns (uint256[] memory) {
        return userDepositIds[user];
    }

    function getDeposit(uint256 depositId) external view returns (SavingsDeposit memory) {
        return deposits[depositId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyRelease(uint256 depositId) external onlyOwner whenPaused nonReentrant {
        SavingsDeposit storage dep = deposits[depositId];
        require(!dep.redeemed, "RovaVault: Deposit already redeemed");

        dep.redeemed = true;
        userTotalSaved[dep.user][dep.tokenAddress] -= dep.amount;

        bool success = IERC20(dep.tokenAddress).transfer(dep.user, dep.amount);
        require(success, "RovaVault: Emergency transfer failed");

        emit EmergencyUnlocked(depositId, dep.user, dep.amount);
    }
}
