import {ethers} from 'ethers';
import Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

import { Token, ChainId, CHAIN_TO_ADDRESSES_MAP } from '@sigismund/sdk-core';
import { computePoolAddress, TickMath } from '@sigismund/v3-sdk';
import { USDC_TOKEN_DEV, USDT_TOKEN_DEV } from './constants';

const chainId = ChainId.AIRDAO_DEV;
//const address = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress;
const V3_CORE_FACTORY_ADDRESS = '0x8631AF99fB2A4aCaffF6Af7C6c5A696ADf163c2a'; //devnet

const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
const signer = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

//const tokenA = new Token(chainId,'0x8c33e9D24eBf3918D37eC2F26BaE044C9fD30Ea9', 18, 'USDC', 'USD Coin'); 
//const tokenB = new Token(chainId,'0x55Be7dd776fAbe89d93bAC66ed1cf0Ab31bdd6eB', 18, 'USDT', 'Tether USD');
const fee = 3000;

const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0).toString();
console.log('sqrtPriceX96:', sqrtPriceX96);


async function main() {
    try {
        const poolAddress = computePoolAddress({
            factoryAddress: V3_CORE_FACTORY_ADDRESS,
            tokenA: USDC_TOKEN_DEV,
            tokenB: USDT_TOKEN_DEV,
            fee: fee,
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
