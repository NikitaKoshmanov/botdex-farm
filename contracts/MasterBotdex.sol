pragma solidity ^0.8.7;

import "./libs/rocketswap-lib/math/SafeMath.sol";
import "./libs/rocketswap-lib/token/BEP20/IBEP20.sol";
import "./libs/rocketswap-lib/token/BEP20/SafeBEP20.sol";
import "./libs/rocketswap-lib/access/Ownable.sol";

import "./RocketPropellantToken.sol";
import "./FuelBar.sol";

// import "@nomiclabs/buidler/console.sol";

interface IMigratorBotdex {
    // Perform LP token migration from legacy BotdexSwap to BOTSwap.
    // Take the current LP token address and return the new LP token address.
    // Migrator should have full access to the caller's LP token.
    // Return the new LP token address.
    //
    // XXX Migrator must have allowance access to BotdexSwap LP tokens.
    // BOTSwap must mint EXACTLY the same amount of BOTSwap LP tokens or
    // else something bad will happen. Traditional BotdexSwap does not
    // do that so be careful!
    function migrate(IBEP20 token) external returns (IBEP20);
}

// MasterBotdex is the master of BOT. He can make BOT and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once BOT is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterBotdex is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of BOTs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accBOTPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accBOTPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. BOTs to distribute per block.
        uint256 lastRewardBlock; // Last block number that BOTs distribution occurs.
        uint256 accBOTPerShare; // Accumulated BOTs per share, times 1e12. See below.
    }

    // The BOT TOKEN!
    RocketPropellant public propellant;
    // The FUEL TOKEN!
    FuelBar public fuel;
    // Dev address.
    address public devaddr;
    // BOT tokens created per block.
    uint256 public propellantPerBlock;
    // Bonus muliplier for early propellant makers.
    uint256 public BONUS_MULTIPLIER = 1;
    // The migrator contract. It has a lot of power. Can only be set through governance (owner).
    IMigratorBotdex public migrator;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when BOT mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        RocketPropellant _propellant,
        FuelBar _fuel,
        address _devaddr,
        uint256 _propellantPerBlock,
        uint256 _startBlock
    ) {
        propellant = _propellant;
        fuel = _fuel;
        devaddr = _devaddr;
        propellantPerBlock = _propellantPerBlock;
        startBlock = _startBlock;

        // staking pool
        poolInfo.push(
            PoolInfo({
                lpToken: _propellant,
                allocPoint: 1000,
                lastRewardBlock: startBlock,
                accBOTPerShare: 0
            })
        );

        totalAllocPoint = 1000;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IBEP20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 _startBlock = startBlock;
        totalAllocPoint += _allocPoint;
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: block.number > _startBlock
                    ? block.number
                    : _startBlock,
                accBOTPerShare: 0
            })
        );
        updateStakingPool();
    }

    // Update the given pool's BOT allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint - prevAllocPoint + _allocPoint;
            updateStakingPool();
        }
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points += poolInfo[pid].allocPoint;
        }
        if (points != 0) {
            points = points / 3;
            totalAllocPoint = totalAllocPoint - poolInfo[0].allocPoint + points;
            poolInfo[0].allocPoint = points;
        }
    }

    // Set the migrator contract. Can only be called by the owner.
    function setMigrator(IMigratorBotdex _migrator) public onlyOwner {
        migrator = _migrator;
    }

    // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
    function migrate(uint256 _pid) public {
        require(address(migrator) != address(0), "migrate: no migrator");
        PoolInfo storage pool = poolInfo[_pid];
        IBEP20 lpToken = pool.lpToken;
        uint256 bal = lpToken.balanceOf(address(this));
        lpToken.safeApprove(address(migrator), bal);
        IBEP20 newLpToken = migrator.migrate(lpToken);
        require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
        pool.lpToken = newLpToken;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        return (_to - _from) * BONUS_MULTIPLIER;
    }

    // View function to see pending BOTs on frontend.
    function pendingBOT(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accBOTPerShare = pool.accBOTPerShare;
        uint256 _lastRewardBlock = pool.lastRewardBlock;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > _lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(_lastRewardBlock, block.number);
            uint256 propellantReward = (multiplier *
                propellantPerBlock *
                pool.allocPoint) / (totalAllocPoint);
            accBOTPerShare =
                accBOTPerShare +
                ((propellantReward * 1e12) / lpSupply);
        }
        return (user.amount * accBOTPerShare) / 1e12 - user.rewardDebt;
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        uint256 _lastRewardBlock = pool.lastRewardBlock;
        if (block.number <= _lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(_lastRewardBlock, block.number);
        uint256 propellantReward = (multiplier *
            propellantPerBlock *
            pool.allocPoint) / (totalAllocPoint);
        propellant.mint(devaddr, propellantReward.div(10));
        propellant.mint(address(fuel), propellantReward);
        pool.accBOTPerShare =
            pool.accBOTPerShare +
            ((propellantReward * 1e12) / (lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterBotdex for BOT allocation.
    function deposit(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, "deposit BOT by staking");

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);

        uint256 _userAmount = user.amount;
        if (_userAmount != 0) {
            uint256 pending = (_userAmount * pool.accBOTPerShare) /
                (1e12) -
                user.rewardDebt;
            if (pending != 0) {
                safeBOTTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
            _userAmount += _amount;
            user.amount = _userAmount;
        }
        user.rewardDebt = (_userAmount * pool.accBOTPerShare) / (1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterBotdex.
    function withdraw(uint256 _pid, uint256 _amount) public {
        require(_pid != 0, "withdraw BOT by unstaking");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 _userAmount = user.amount;
        require(_userAmount >= _amount, "withdraw: not good");

        updatePool(_pid);
        uint256 _accBOTPerShare = pool.accBOTPerShare;
        uint256 pending = (_userAmount * _accBOTPerShare) /
            (1e12) -
            user.rewardDebt;
        if (pending != 0) {
            safeBOTTransfer(msg.sender, pending);
        }
        if (_amount != 0) {
            _userAmount -= _amount;
            user.amount = _userAmount;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = (_userAmount * _accBOTPerShare) / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Stake BOT tokens to MasterBotdex
    function enterStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        uint256 _userAmount = user.amount;
        uint256 _accBOTPerShare = pool.accBOTPerShare;
        if (_userAmount != 0) {
            uint256 pending = (_userAmount * _accBOTPerShare) /
                1e12 -
                user.rewardDebt;
            if (pending != 0) {
                safeBOTTransfer(msg.sender, pending);
            }
        }
        if (_amount != 0) {
            pool.lpToken.safeTransferFrom(
                address(msg.sender),
                address(this),
                _amount
            );
            _userAmount += _amount;
            user.amount = _userAmount;
        }
        user.rewardDebt = (_userAmount * pool.accBOTPerShare) / 1e12;

        fuel.mint(msg.sender, _amount);
        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw BOT tokens from STAKING.
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        uint256 _userAmount = user.amount;
        require(_userAmount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 _accBOTPerShare = pool.accBOTPerShare;
        uint256 pending = (_userAmount * _accBOTPerShare) /
            1e12 -
            user.rewardDebt;
        if (pending != 0) {
            safeBOTTransfer(msg.sender, pending);
        }
        if (_amount != 0) {
            _userAmount -= _amount;
            user.amount = _userAmount;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = (_userAmount * _accBOTPerShare) / 1e12;

        fuel.burn(msg.sender, _amount);
        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 _userAmount = user.amount;
        pool.lpToken.safeTransfer(address(msg.sender), _userAmount);
        emit EmergencyWithdraw(msg.sender, _pid, _userAmount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe propellant transfer function, just in case if rounding error causes pool to not have enough BOTs.
    function safeBOTTransfer(address _to, uint256 _amount) internal {
        fuel.safeBOTTransfer(_to, _amount);
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}
