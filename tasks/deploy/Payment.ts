import { ethers } from "ethers";
import { task } from "hardhat/config";
import { v4 } from "uuid";

task("payment:deploy")
  .addParam("vault", "Vault address")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ vault, verify }, hre) => {
    const contractFactory = await hre.ethers.getContractFactory("Payment");

    const contractProxy = await hre.upgrades.deployProxy(
      contractFactory,
      [vault],
      {
        txOverrides: {
          gasLimit: 3000000, // 3M gas limit
          gasPrice: ethers.parseUnits("400", "gwei"), // 400 gwei gas price (above minimum 360 gwei)
          // Or use EIP-1559:
          // maxFeePerGas: ethers.parseUnits("400", "gwei"),
          // maxPriorityFeePerGas: ethers.parseUnits("50", "gwei"),
        },
      }
    );
    await contractProxy.waitForDeployment();

    const contractAddress = await contractProxy.getAddress();
    console.log("Contract proxy deployed to:", contractAddress);

    if (verify) {
      // We need to wait a little bit to verify the contract after deployment
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
        libraries: {},
      });
    }
  });

task("payment:setPause")
  .addParam("contract", "Contract address")
  .addFlag("pause", "Pause")
  .setAction(async ({ contract: contractAddress, pause }, hre) => {
    const contractProxy = await hre.ethers.getContractAt(
      "Payment",
      contractAddress
    );

    const tx = await (pause ? contractProxy.pause() : contractProxy.unpause());
    await tx.wait();

    console.log("Transaction hash:", tx.hash);
  });

task("payment:setVault")
  .addParam("contract", "Contract address")
  .addParam("vault", "Vault address")
  .setAction(async ({ contract: contractAddress, vault }, hre) => {
    const contractProxy = await hre.ethers.getContractAt(
      "Payment",
      contractAddress
    );

    const tx = await contractProxy.setVault(vault);
    await tx.wait();

    console.log("Transaction hash:", tx.hash);
  });

task("payment:pay")
  .addParam("contract", "Contract address")
  .addParam("payment", "Payment token address", ethers.ZeroAddress)
  .addParam("amount", "Amount")
  .addParam("id", "Payment ID", v4())
  .setAction(
    async (
      {
        contract: contractAddress,
        payment: paymentToken,
        amount,
        id: paymentId,
      },
      hre
    ) => {
      const contractProxy = await hre.ethers.getContractAt(
        "Payment",
        contractAddress
      );

      console.log("Payment token:", paymentToken);
      console.log("Amount:", amount);
      console.log("Payment ID:", paymentId);
      console.log("Contract address:", contractAddress);

      const amountInWei = ethers.parseEther(amount.toString());

      const tx = await contractProxy.pay(
        paymentToken,
        amountInWei,
        ethers.keccak256(ethers.toUtf8Bytes(paymentId)),
        {
          value: paymentToken === ethers.ZeroAddress ? amountInWei : 0,
          // gasLimit: 3000000,
          // gasPrice: ethers.parseUnits("400", "gwei"),
        }
      );
      await tx.wait();

      console.log("Transaction hash:", tx.hash);
    }
  );

task("payment:depositETH")
  .addParam("contract", "Contract address")
  .addParam("amount", "Amount")
  .setAction(async ({ contract: contractAddress, amount }, hre) => {
    const contractProxy = await hre.ethers.getContractAt(
      "Payment",
      contractAddress
    );

    const tx = await contractProxy.depositETH({
      value: ethers.parseEther(amount.toString()),
      // gasLimit: 3000000,
      // gasPrice: ethers.parseUnits("400", "gwei"),
    });
    await tx.wait();

    console.log("Transaction hash:", tx.hash);
  });

task("payment:upgrade")
  .addParam("contract", "contractAddress")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ contract: contractAddress, verify }, hre) => {
    const contractFactory = await hre.ethers.getContractFactory("Payment");

    const contractProxy = await hre.upgrades.upgradeProxy(
      contractAddress,
      contractFactory,
      {
        // txOverrides: {
        //   gasLimit: 3000000,
        //   gasPrice: ethers.parseUnits("400", "gwei"),
        // },
      }
    );
    await contractProxy.waitForDeployment();

    console.log("Contract proxy deployed to:", contractAddress);

    if (verify) {
      // We need to wait a little bit to verify the contract after deployment
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
        libraries: {},
      });
    }
  });

task("payment:decodeEvent")
  .addParam("contract", "Contract address")
  .addOptionalParam("event", "Event name to filter", "*")
  .addOptionalParam("fromblock", "From block number", "0")
  .addOptionalParam("toblock", "To block number", "latest")
  .setAction(
    async ({ contract: contractAddress, event, fromblock, toblock }, hre) => {
      const contractProxy = await hre.ethers.getContractAt(
        "Payment",
        contractAddress
      );

      console.log(`Querying events from contract: ${contractAddress}`);
      console.log(`Event filter: ${event}`);
      console.log(`Block range: ${fromblock} to ${toblock}`);

      try {
        let filter;

        // Create filter based on event parameter
        if (event === "*" || !event) {
          // Query all events
          filter = "*";
        } else {
          // Query specific event
          const eventFilter = (contractProxy.filters as any)[event];
          if (!eventFilter) {
            console.log(`Event '${event}' not found in contract ABI`);
            return;
          }
          filter = eventFilter();
        }

        const events = await contractProxy.queryFilter(
          filter,
          parseInt(fromblock),
          toblock === "latest" ? "latest" : parseInt(toblock)
        );

        if (events.length === 0) {
          console.log("No events found");
          return;
        }

        console.log(`\nFound ${events.length} events:\n`);

        events.forEach((event, index) => {
          console.log(`Event ${index + 1}:`);
          console.log("  Name:", event.eventName);
          console.log("  Block:", event.blockNumber);
          console.log("  Transaction:", event.transactionHash);
          console.log("  Args:", event.args);
          console.log("  Raw Log:", {
            address: event.address,
            topics: event.topics,
            data: event.data,
          });
          console.log("---");
        });
      } catch (error) {
        console.error("Error querying events:", error);
      }
    }
  );
