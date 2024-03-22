import {ethers} from 'ethers';
import Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';

import {
    DEV_V3_CORE_FACTORY_ADDRESS,
    DEV_SIGNER,
    DEV_USDC_TOKEN,
    DEV_USDT_TOKEN,
    USDC_USDT_FEE
} from './constants';

const signer = DEV_SIGNER;

const factory = new ethers.Contract(DEV_V3_CORE_FACTORY_ADDRESS, Factory.abi, signer);

async function main() {
    try {
       const tx = await factory.createPool(
           DEV_USDC_TOKEN.address,
           DEV_USDT_TOKEN.address,
           USDC_USDT_FEE,);
        console.log(tx);

        await tx.wait();
        console.log('Pool created');
    } catch (e) {
        console.error(e);
    }
}

main();


