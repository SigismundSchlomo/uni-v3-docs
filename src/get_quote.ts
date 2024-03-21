import { ethers } from 'ethers';
import { Percent, ChainId, CHAIN_TO_ADDRESSES_MAP, QUOTER_ADDRESSES } from '@sigismund/sdk-core';
import { Pool, Position, MintOptions, NonfungiblePositionManager, computePoolAddress, nearestUsableTick } from '@sigismund/v3-sdk';
import { USDC_TOKEN, USDT_TOKEN, ERC20_ABI } from './constants';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import QuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
//import QuoterABI from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';

export const chainId = ChainId.AIRDAO_TEST;
export const V3_CORE_FACTORY_ADDRESS = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress;
export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS: string =
    typeof CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress == 'string'
        ? CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress : '';

const QUOTER_CONTRACT_ADDRESS = CHAIN_TO_ADDRESSES_MAP[chainId].quoterAddress;

export const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-test.io');
export const wallet = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

async function main() {
    try {
        // Get pool info
        const currentPoolAddress = computePoolAddress({
            factoryAddress: V3_CORE_FACTORY_ADDRESS,
            tokenA: USDC_TOKEN,
            tokenB: USDT_TOKEN,
            fee: 3000,
        })

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

        // Create quoter contract
        const quoterContract = new ethers.Contract(
            QUOTER_CONTRACT_ADDRESS,
            QuoterV2ABI.abi,
            provider
        );

        console.log(quoterContract);

        const params = {
            tokenIn: ethers.utils.getAddress(token0),
            tokenOut: ethers.utils.getAddress(token1),
            fee: fee,
            amountIn: ethers.utils.parseUnits('100', USDC_TOKEN.decimals),
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

 
