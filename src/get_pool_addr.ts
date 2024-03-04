import { Token, ChainId, CHAIN_TO_ADDRESSES_MAP } from '@sigismund/sdk-core';
import { computePoolAddress } from '@sigismund/v3-sdk';

const chainId = ChainId.AIRDAO_TEST;
const address = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress;

const tokenA = new Token(chainId,'0x8c33e9D24eBf3918D37eC2F26BaE044C9fD30Ea9', 18, 'USDC', 'USD Coin'); 
const tokenB = new Token(chainId,'0x55Be7dd776fAbe89d93bAC66ed1cf0Ab31bdd6eB', 18, 'USDT', 'Tether USD');
const fee = 3000;

async function main() {
    try {
        const poolAddress = computePoolAddress({
            factoryAddress: address,
            tokenA: tokenA,
            tokenB: tokenB,
            fee: fee,
        })
        console.log(poolAddress);
    } catch (e) {
        console.error(e);
    }
}

main();


