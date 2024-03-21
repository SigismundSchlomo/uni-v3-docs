import {ethers} from 'ethers';
import Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';

const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
const signer = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

const factory = new ethers.Contract(V3_CORE_FACTORY_ADDRESS, Factory.abi, signer);

//const USDC_addr = '0x8c33e9D24eBf3918D37eC2F26BaE044C9fD30Ea9'; //testnet
//const USDT_addr = '0x55Be7dd776fAbe89d93bAC66ed1cf0Ab31bdd6eB'; //testnet

const USDC_addr = '0x94F1Ec9c6305e2A457FEBED006405C3cbA2877E3'; //devnet
const USDT_addr = '0xacA570AF74A0bE1bC776Eb80A0f1D6bfEB696ae0'; //devnet
const fee = 3000;

async function main() {
    try {
       const tx = await factory.createPool(USDC_addr, USDT_addr, fee);
        console.log(tx);

        await tx.wait();
        console.log('Pool created');
    } catch (e) {
        console.error(e);
    }
}

main();


