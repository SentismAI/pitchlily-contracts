// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Payment is
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    address private _vault;

    event Paid(
        address indexed sender,
        address indexed paymentToken,
        uint256 amount,
        bytes32 paymentId
    );

    event DepositedETH(uint256 amount);

    function initialize(address vault_) external initializer {
        __Ownable_init(_msgSender());
        __ReentrancyGuard_init();

        _vault = vault_;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setVault(address vault_) external onlyOwner {
        _vault = vault_;
    }

    function depositETH() external payable nonReentrant onlyOwner {
        (bool success, ) = _vault.call{value: msg.value}("");
        require(success, "Transfer failed");
        emit DepositedETH(msg.value);
    }

    function pay(
        address paymentToken,
        uint256 amount,
        bytes32 paymentId
    ) external payable nonReentrant whenNotPaused {
        require(_vault != address(0), "Vault not set");
        require(paymentId != bytes32(0), "Invalid payment ID");

        if (paymentToken == address(0)) {
            require(msg.value > 0, "Invalid amount");
            (bool success, ) = _vault.call{value: msg.value}("");
            require(success, "Transfer failed");
            emit Paid(_msgSender(), paymentToken, msg.value, paymentId);
        } else {
            require(amount > 0, "Invalid amount");
            require(
                IERC20(paymentToken).allowance(_msgSender(), address(this)) >=
                    amount,
                "Insufficient allowance"
            );
            IERC20(paymentToken).transferFrom(_msgSender(), _vault, amount);
            emit Paid(_msgSender(), paymentToken, amount, paymentId);
        }
    }
}
