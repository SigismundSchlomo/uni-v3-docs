import { ethers } from 'ethers';
import { Percent } from '@sigismund/sdk-core';
import { Pool, Position, MintOptions, NonfungiblePositionManager, computePoolAddress, nearestUsableTick } from '@sigismund/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { 
    DEV_USDC_TOKEN,
    DEV_USDT_TOKEN,
    ERC20_ABI,
    DEV_V3_CORE_FACTORY_ADDRESS,
    DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    DEV_PROVIDER,
    DEV_SIGNER,
} from './constants';

const provider = DEV_PROVIDER;
const wallet = DEV_SIGNER;
const SUM_TO_MINT = '100000';

async function main() {
    try {
        // get aproval for USDC token transfer
        const usdcContract = new ethers.Contract(
            DEV_USDC_TOKEN.address,
            ERC20_ABI,
            wallet
        )

        const usdcApproval = await usdcContract.approve(
            DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(SUM_TO_MINT, DEV_USDC_TOKEN.decimals)
        );
        await usdcApproval.wait();
        console.log('USDC aproval tx:', usdcApproval);

        
        // Get aproval for USDT token transfer
        const usdtContract = new ethers.Contract(
            DEV_USDT_TOKEN.address,
            ERC20_ABI,
            wallet
        )

        const usdtApproval = await usdtContract.approve(
            DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(SUM_TO_MINT,DEV_USDT_TOKEN.decimals)
        );
        await usdtApproval.wait();
        console.log('USDT aproval tx:', usdtApproval);

        // Get pool info
        const currentPoolAddress = computePoolAddress({
            factoryAddress: DEV_V3_CORE_FACTORY_ADDRESS,
            tokenA: DEV_USDC_TOKEN,
            tokenB: DEV_USDT_TOKEN,
            fee: 3000,
        })

        console.log('Pool address:', currentPoolAddress);

        const poolContract = new ethers.Contract(
            currentPoolAddress,
            IUniswapV3PoolABI.abi,
            provider
        )

        const [token0, token1, fee, tickSpacing, liquidity, slot0] =
            await Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.fee(),
            poolContract.tickSpacing(),
            poolContract.liquidity(),
            poolContract.slot0(),
        ])

        // Create pool 
        const pool = new Pool(
            DEV_USDC_TOKEN,
            DEV_USDT_TOKEN,
            fee,
            slot0.sqrtPriceX96.toString(),
            liquidity.toString(),
            slot0.tick,
        );
        
        // Create position 
        const position = Position.fromAmounts({
            pool,
            tickLower: nearestUsableTick(slot0.tick, tickSpacing) - tickSpacing * 2,
            tickUpper: nearestUsableTick(slot0.tick, tickSpacing) + tickSpacing * 2,
            amount0: ethers.utils.parseUnits(SUM_TO_MINT, DEV_USDC_TOKEN.decimals).toString(),
            amount1: ethers.utils.parseUnits(SUM_TO_MINT, DEV_USDT_TOKEN.decimals).toString(),
            useFullPrecision: true,
        });

        const MintOptions: MintOptions = {
            recipient: wallet.address,
            deadline: Math.floor(Date.now() / 1000) + 60 * 20,
            slippageTolerance: new Percent(50, 10_000)
        }

        const { calldata, value } = NonfungiblePositionManager.addCallParameters(
            position,
            MintOptions
        );

        // Mint position
        const est_tx = {
            data: calldata,
            to: DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            value: value,
            from: wallet.address,
        };
        const gasLimit = await provider.estimateGas(est_tx);
        console.log('Estimated gas limit:', gasLimit.toNumber());
        const gasPrice = await provider.getGasPrice();
        console.log('Gas price:', gasPrice.toNumber());
        const tx = {
            ...est_tx,
            gasLimit: gasLimit.toNumber(),
            gasPrice: gasPrice.toNumber(),
        };
        

        const txResponse = await wallet.sendTransaction(tx);
        const resp = await txResponse.wait();
        console.log('Mint tx:', resp);

    } catch (e) {
        console.error(e);
    }
}

main();

 
