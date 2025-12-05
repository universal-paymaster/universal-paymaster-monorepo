import hre from 'hardhat';
import { openPaymasterAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../../src/config';

/**
 * Create a new pool for the selected token
 */
async function main() {
	const [deployer] = await hre.viem.getWalletClients();
	const [chainConfig] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const paymasterContract = getContract({
		address: chainConfig.PAYMASTER,
		abi: openPaymasterAbi,
		client: { public: publicClient, wallet: deployer },
	});

	const hash = await paymasterContract.write.initializePool([
		chainConfig.USDC,
		100,
		100,
		chainConfig.ORACLE,
	]);
	console.log('hash', hash);

	await publicClient.waitForTransactionReceipt({ hash });

	const pool = await paymasterContract.read.pools([chainConfig.USDC]);
	console.log('pool', pool);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
