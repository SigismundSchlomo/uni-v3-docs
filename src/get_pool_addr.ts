import { computePoolAddress } from '@sigismund/v3-sdk';
import {
    DEV_V3_CORE_FACTORY_ADDRESS,
    DEV_USDC_TOKEN,
    DEV_USDT_TOKEN,
    USDC_USDT_FEE,
} from './constants';

async function main() {
    try {
        const poolAddress = computePoolAddress({
            factoryAddress: DEV_V3_CORE_FACTORY_ADDRESS,
            tokenA: DEV_USDC_TOKEN,
            tokenB: DEV_USDT_TOKEN,
            fee: USDC_USDT_FEE,
        })
        console.log(poolAddress);
    } catch (e) {
        console.error(e);
    }
}

main();


