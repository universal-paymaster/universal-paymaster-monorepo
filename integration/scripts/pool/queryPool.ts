import hre from 'hardhat';
import { openPaymasterAbi, entryPointAbi } from 'paymaster-sdk';
import { getContract } from 'viem';
import { getChainConfig } from '../../src/config';

/**
 * Deploy the OpenPaymaster contract to the selected chain
 */
async function main() {
	const [chainConfig] = getChainConfig();
	const publicClient = await hre.viem.getPublicClient();

	const paymasterContract = getContract({
		address: chainConfig.PAYMASTER,
		abi: openPaymasterAbi,
		client: { public: publicClient },
	});

	const entryPointContract = getContract({
		address: chainConfig.ENTRY_POINT,
		abi: entryPointAbi,
		client: { public: publicClient },
	});

	const paymasterDeposit = await entryPointContract.read.balanceOf([chainConfig.PAYMASTER]);
	const ethReserves = await paymasterContract.read.getPoolEthReserves([chainConfig.USDC]);
	const tokenReserves = await paymasterContract.read.getPoolTokenReserves([chainConfig.USDC]);
	const pool = await paymasterContract.read.pools([chainConfig.USDC]);

	console.log({
		paymasterDeposit,
		ethReserves,
		tokenReserves,
		pool,
	})
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
