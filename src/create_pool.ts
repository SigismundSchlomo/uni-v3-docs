import {ethers} from 'ethers';
import Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';

import { ChainId, CHAIN_TO_ADDRESSES_MAP } from '@sigismund/sdk-core';

const chainId = ChainId.AIRDAO_TEST;
const address = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress;

const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-test.io');
const signer = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

const factory = new ethers.Contract(address, Factory.abi, signer);

const tokenA = '0x8c33e9D24eBf3918D37eC2F26BaE044C9fD30Ea9';
const tokenB = '0x55Be7dd776fAbe89d93bAC66ed1cf0Ab31bdd6eB';
const fee = 3000;

async function main() {
    try {
        const tx = await factory.createPool(tokenA, tokenB, fee);
        console.log(tx);

        await tx.wait();
        console.log('Pool created');
    } catch (e) {
        console.error(e);
    }
}

main();


