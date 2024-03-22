import {ethers} from 'ethers';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

import { computePoolAddress, TickMath } from '@sigismund/v3-sdk';
import { 
    DEV_USDC_TOKEN, 
    DEV_USDT_TOKEN, 
    DEV_V3_CORE_FACTORY_ADDRESS,
    USDC_USDT_FEE,
    DEV_SIGNER
} from './constants';

const signer = DEV_SIGNER;

const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0).toString();
console.log('sqrtPriceX96:', sqrtPriceX96);


async function main() {
    try {
        const poolAddress = computePoolAddress({
            factoryAddress: DEV_V3_CORE_FACTORY_ADDRESS,
            tokenA: DEV_USDC_TOKEN,
            tokenB: DEV_USDT_TOKEN,
            fee: USDC_USDT_FEE,
        });

        const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI.abi, signer);
        
        const tx = await poolContract.initialize(sqrtPriceX96);
        await tx.wait();
        console.log('Pool initialized');
        console.log(tx.hash);

    } catch (e) {
        console.error(e);
    }
}

main();
