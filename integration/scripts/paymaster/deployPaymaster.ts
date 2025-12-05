import hre from 'hardhat';
import { openPaymasterAbi } from 'paymaster-sdk';
import { loadForgeArtifact } from '../../src/helpers';

/**
 * Deploy the OpenPaymaster contract to the selected chain
 */
async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const publicClient = await hre.viem.getPublicClient();
	const { bytecode } = loadForgeArtifact('OpenPaymaster');

	const hash = await deployer.deployContract({
		abi: openPaymasterAbi,
		bytecode,
		args: [],
	});

	console.log(`Transaction hash: ${hash}`);
	console.log('Waiting for confirmation...');

	// Wait for deployment
	const receipt = await publicClient.waitForTransactionReceipt({ hash });

	if (!receipt.contractAddress) {
		throw new Error('Deployment failed: no contract address in receipt');
	}

	console.log('\n✅ Deployment successful!');
	console.log(`Paymaster address: ${receipt.contractAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
