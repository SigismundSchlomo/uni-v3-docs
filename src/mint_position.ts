import { ethers } from 'ethers';
import { Percent, ChainId, CHAIN_TO_ADDRESSES_MAP } from '@sigismund/sdk-core';
import { Pool, Position, MintOptions, NonfungiblePositionManager, computePoolAddress, nearestUsableTick } from '@sigismund/v3-sdk';
import { USDC_TOKEN_DEV, USDT_TOKEN_DEV, ERC20_ABI } from './constants';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

export const chainId = ChainId.AIRDAO_TEST;
//export const V3_CORE_FACTORY_ADDRESS = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress; //testnet
const V3_CORE_FACTORY_ADDRESS = '0x8631AF99fB2A4aCaffF6Af7C6c5A696ADf163c2a'; //devnet

//export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS: string =
//    typeof CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress == 'string'
//        ? CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress : '';
const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xD3FeB6dCdeA02ecD1FA5127535D2b624eE48b843'; //devnet

export const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
export const wallet = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

const SUM_TO_MINT = '100000';

async function main() {
    try {
        // get aproval for USDC token transfer
        const usdcContract = new ethers.Contract(
            USDC_TOKEN_DEV.address,
            ERC20_ABI,
            wallet
        )

        const usdcApproval = await usdcContract.approve(
            NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(SUM_TO_MINT, USDC_TOKEN_DEV.decimals)
        );
        await usdcApproval.wait();
        console.log('USDC aproval tx:', usdcApproval);

        
        // Get aproval for USDT token transfer
        const usdtContract = new ethers.Contract(
            USDT_TOKEN_DEV.address,
            ERC20_ABI,
            wallet
        )

        const usdtApproval = await usdtContract.approve(
            NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(SUM_TO_MINT, USDT_TOKEN_DEV.decimals)
        );
        await usdtApproval.wait();
        console.log('USDT aproval tx:', usdtApproval);

        // Get pool info
        const currentPoolAddress = computePoolAddress({
            factoryAddress: V3_CORE_FACTORY_ADDRESS,
            tokenA: USDC_TOKEN_DEV,
            tokenB: USDT_TOKEN_DEV,
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
            USDC_TOKEN_DEV,
            USDT_TOKEN_DEV,
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
            amount0: ethers.utils.parseUnits(SUM_TO_MINT, USDC_TOKEN_DEV.decimals).toString(),
            amount1: ethers.utils.parseUnits(SUM_TO_MINT, USDT_TOKEN_DEV.decimals).toString(),
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
            to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
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
        await txResponse.wait();
        console.log('Mint tx:', txResponse);

    } catch (e) {
        console.error(e);
    }
}

main();

 
