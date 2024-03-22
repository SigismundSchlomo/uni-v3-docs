import { ethers } from 'ethers';
import { computePoolAddress } from '@sigismund/v3-sdk';
import { 
    DEV_USDC_TOKEN,
    DEV_USDT_TOKEN,
    USDC_USDT_FEE,
    DEV_PROVIDER,
    DEV_V3_CORE_FACTORY_ADDRESS,
    DEV_QUOTER_V2_CONTRACT_ADDRESS,
    DEV_SIGNER,
} from './constants';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import QuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';

const provider = DEV_PROVIDER;
const wallet = DEV_SIGNER;

async function main() {
    try {
        // Get pool info
        const currentPoolAddress = computePoolAddress({
            factoryAddress: DEV_V3_CORE_FACTORY_ADDRESS,
            tokenA: DEV_USDC_TOKEN,
            tokenB: DEV_USDT_TOKEN,
            fee: USDC_USDT_FEE,
        })

        const poolContract = new ethers.Contract(
            currentPoolAddress,
            IUniswapV3PoolABI.abi,
            provider
        )

        const [token0, token1, fee, tickSpacing, iquidity, slot0] =
            await Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.fee(),
            poolContract.tickSpacing(),
            poolContract.liquidity(),
            poolContract.slot0(),
        ])

        // Create quoter contract
        const quoterContract = new ethers.Contract(
            DEV_QUOTER_V2_CONTRACT_ADDRESS,
            QuoterV2ABI.abi,
            provider
        );

        console.log(quoterContract);

        const params = {
            tokenIn: ethers.utils.getAddress(token0),
            tokenOut: ethers.utils.getAddress(token1),
            fee: fee,
            amountIn: ethers.utils.parseUnits('100', DEV_USDC_TOKEN.decimals),
            sqrtPriceLimitX96: 0,
        }
        console.log('Params:', params);
        // Get quote
        const quotedAmount = await quoterContract.callStatic.quoteExactInputSingle(params, {value: 0});

        console.log('Quoted amount:', quotedAmount.toString());



    } catch (e) {
        console.error(e);
    }
}

main();

 
