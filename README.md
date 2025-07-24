# Payment Smart Contract

## Introduction

This project provides a Payment smart contract that enables payments using BNB (on BSC), HBAR (on Hedera), or ERC20/BEP20 tokens. It supports vault management, pausing/unpausing, upgradability, and event querying. The contract has been deployed on two networks:

- **Hedera Mainnet:** [0.0.9374436](https://hashscan.io/mainnet/contract/0.0.9374436)
- **BSC Mainnet:** [0x0C87C8Bc77180Df785bA7e31268b88EAc6bd5487](https://bscscan.com/address/0x0C87C8Bc77180Df785bA7e31268b88EAc6bd5487)

## Main Features
- Payment with BNB (BSC), HBAR (Hedera), or tokens (ERC20/BEP20)
- Vault management for receiving funds
- Pause/unpause contract
- Upgradable contract (proxy pattern)
- Payment event querying

## Installation

```bash
yarn install
```

## Configuration
Create a `.env` file with the following variables:

```
PRIVATE_KEY=your_private_key
RPC_URL_BSC_MAINNET=https://bsc-dataseed.binance.org
RPC_URL_HEDERA_MAINNET=https://mainnet.hashio.io/api
ETHERSCAN_API_KEY_BSC_MAINNET=your_bscscan_api_key
```

## Deploy Contract

```bash
yarn hardhat payment:deploy --network bscMainnet --vault <vault_address> [--verify]
yarn hardhat payment:deploy --network hederaMainnet --vault <vault_address> [--verify]
```

## Usage

### Make a Payment
```bash
yarn hardhat payment:pay --network <network> --contract <contract_address> --payment <token_address_or_0x0> --amount <amount> --id <payment_id>
```
- For native token payments (BNB on BSC, HBAR on Hedera), use `--payment 0x0000000000000000000000000000000000000000`
- For token payments, use the token contract address as `--payment`

### Deposit BNB/HBAR to Vault
```bash
yarn hardhat payment:depositETH --network <network> --contract <contract_address> --amount <amount>
```
- On BSC, this deposits BNB. On Hedera, this deposits HBAR.

### Pause/Unpause Contract
```bash
yarn hardhat payment:setPause --network <network> --contract <contract_address> --pause
# or omit --pause to unpause
```

### Change Vault
```bash
yarn hardhat payment:setVault --network <network> --contract <contract_address> --vault <new_vault_address>
```

### Upgrade Contract
```bash
yarn hardhat payment:upgrade --network <network> --contract <contract_address> [--verify]
```

### Query Events
```bash
yarn hardhat payment:decodeEvent --network <network> --contract <contract_address> [--event <event_name>] [--fromblock <from>] [--toblock <to>]
```

## Libraries Used
- Hardhat
- OpenZeppelin Contracts & Upgrades
- Ethers.js
- TypeChain

## License
MIT 