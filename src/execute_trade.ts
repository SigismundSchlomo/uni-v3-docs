import { ethers } from 'ethers';
import { Percent, ChainId, CHAIN_TO_ADDRESSES_MAP, CurrencyAmount, TradeType } from '@sigismund/sdk-core';
import { Pool, SwapOptions, Route, computePoolAddress, Trade} from '@sigismund/v3-sdk';
import { USDC_TOKEN_DEV, USDT_TOKEN_DEV, ERC20_ABI } from './constants';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import QuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
import SwapRouter from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';

import JSBI from 'jsbi';

//export const chainId = ChainId.AIRDAO_TEST;
//export const V3_CORE_FACTORY_ADDRESS = CHAIN_TO_ADDRESSES_MAP[chainId].v3CoreFactoryAddress;
const V3_CORE_FACTORY_ADDRESS = '0x8631AF99fB2A4aCaffF6Af7C6c5A696ADf163c2a';
//export const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS: string =
//    typeof CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress == 'string'
//        ? CHAIN_TO_ADDRESSES_MAP[chainId].nonfungiblePositionManagerAddress : '';
const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xD3FeB6dCdeA02ecD1FA5127535D2b624eE48b843' //devnet

//const QUOTER_CONTRACT_ADDRESS = CHAIN_TO_ADDRESSES_MAP[chainId].quoterAddress;
const QUOTER_CONTRACT_ADDRESS = '0xfe99543dca6Cb549FaF0fb024C41103862ADFFaA'; //devnet
//const SWAP_ROUTER_ADDRESS: string = "0xceCd6B1ee8B685457e24Faa52355e8Edf0239Cd5";
const SWAP_ROUTER_ADDRESS = '0x47aB8c40536d9062D7FC7778d7e85217036505Ef' //devnet

export const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
export const wallet = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

async function main() {
    try {
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

        const [fee, tickSpacing, liquidity, slot0] =
            await Promise.all([
            //poolContract.token0(),
            //poolContract.token1(),
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

        console.log('Pool liquidity:', pool.liquidity.toString());

        // Create route
        const route = new Route([pool], USDC_TOKEN_DEV, USDT_TOKEN_DEV); // the first token is the token in, the second is the token out 
        
        // Get quote
        const quoterContract = new ethers.Contract(
            QUOTER_CONTRACT_ADDRESS,
            QuoterV2ABI.abi,
            provider
        );

        const params = {
            tokenIn: USDC_TOKEN_DEV.address,
            tokenOut: USDT_TOKEN_DEV.address,
            fee: fee,
            amountIn: ethers.utils.parseUnits('10', USDC_TOKEN_DEV.decimals),
            sqrtPriceLimitX96: 0,
        }
        console.log('Amount in:', params.amountIn.toString());
        const quotedAmounts = await quoterContract.callStatic.quoteExactInputSingle(params, {value: 0});
        console.log('Quoted amount out:', quotedAmounts.amountOut.toString());

        // Construct trade
        const uncheckedTrade = Trade.createUncheckedTrade({
            route: route,
            inputAmount: CurrencyAmount.fromRawAmount(USDC_TOKEN_DEV, params.amountIn.toString()),
            outputAmount: CurrencyAmount.fromRawAmount(USDT_TOKEN_DEV, JSBI.BigInt(quotedAmounts[0])),
            tradeType: TradeType.EXACT_INPUT,
        });
        console.log('Trade input amount:', uncheckedTrade.inputAmount.toSignificant(6));
        console.log('Trade output amount:', uncheckedTrade.outputAmount.toSignificant(6));
        console.log('Trade price:', uncheckedTrade.executionPrice.toSignificant(6));
        console.log('Trade impact:', uncheckedTrade.priceImpact.toSignificant(6));

        // Execute trade
        // get aproval for USDC token transfer
        const usdcContract = new ethers.Contract(
            USDC_TOKEN_DEV.address,
            ERC20_ABI,
            wallet
        )

        const usdcApproval = await usdcContract.approve(
            SWAP_ROUTER_ADDRESS,
            ethers.utils.parseUnits('100', USDC_TOKEN_DEV.decimals)
        );
        console.log('USDC aproval tx hash:', usdcApproval.hash);
        const approvalResult = await usdcApproval.wait();
        console.log('USDC aproval result:', approvalResult.status);

        const options: SwapOptions = {
            slippageTolerance: new Percent(50, 10_000), // 0.5%
            deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
            recipient: wallet.address,
        };

        const swapRouterContract = new ethers.Contract(
            SWAP_ROUTER_ADDRESS,
            SwapRouter.abi,
            wallet
        );

        const weth9 = await swapRouterContract.WETH9();
        console.log('WETH9:', weth9);
        const wamb = '0x01873090E888bFEc51DB4716A985C5A8cC5F09c3';
        console.log('weth = wamb:', weth9 === wamb);

        const exactInputSingleParams = {
            tokenIn: USDC_TOKEN_DEV.address,
            tokenOut: USDT_TOKEN_DEV.address,
            fee: fee,
            recipient: wallet.address,
            deadline: options.deadline,
            amountIn: params.amountIn.toString(),
            amountOutMinimum: 1,
            sqrtPriceLimitX96: 0,
        }

        console.log('Exact input single params:', exactInputSingleParams);

        const gasPrice = await provider.getGasPrice();
        console.log('Gas price:', gasPrice.toNumber());

        const swapRouterExactInputSingle = await swapRouterContract.exactInputSingle(exactInputSingleParams, { gasPrice: gasPrice });
        console.log('SwapRouter exactInputSingle result:', swapRouterExactInputSingle);
        const result = await swapRouterExactInputSingle.wait();
        console.log('SwapRouter exactInputSingle tx result:', result.status);

        //const methodParams = SwapRouter.swapCallParameters([uncheckedTrade], options);
        //const tx = {
        //    data: methodParams.calldata,
        //    to: SWAP_ROUTER_ADDRESS,
        //    value: methodParams.value,
        //    from: wallet.address,
        //    gasPrice: 10,
        //    gasLimit: 4000000,
        //};

        //const res = await wallet.sendTransaction(tx);
        //console.log('Trade tx:', res);
        //const resp = await res.wait();
        //console.log('Trade tx result:', resp);
    } catch (e) {
        console.error(e);
    }
}

main();

 
