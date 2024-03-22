import { ethers } from 'ethers';
import { Percent, CurrencyAmount, TradeType } from '@sigismund/sdk-core';
import { Pool, SwapOptions, Route, computePoolAddress, Trade} from '@sigismund/v3-sdk';
import { 
    DEV_USDC_TOKEN,
    DEV_USDT_TOKEN,
    ERC20_ABI,
    DEV_V3_CORE_FACTORY_ADDRESS,
    DEV_SWAP_ROUTER_CONTRACT_ADDRESS,
    DEV_QUOTER_CONTRACT_ADDRESS
} from './constants';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import QuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
import SwapRouter from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';

import JSBI from 'jsbi';

export const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
export const wallet = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);

async function main() {
    try {
        // Get pool info
        const currentPoolAddress = computePoolAddress({
            factoryAddress: DEV_V3_CORE_FACTORY_ADDRESS,
            tokenA: DEV_USDC_TOKEN,
            tokenB: DEV_USDT_TOKEN,
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
            poolContract.fee(),
            poolContract.tickSpacing(),
            poolContract.liquidity(),
            poolContract.slot0(),
        ])

        // Create pool object
        const pool = new Pool(
            DEV_USDC_TOKEN,
            DEV_USDT_TOKEN,
            fee,
            slot0.sqrtPriceX96.toString(),
            liquidity.toString(),
            slot0.tick,
        );

        console.log('Pool liquidity:', pool.liquidity.toString());

        // Create route for a single pool. Routng for cross pools would be researched later 
        const route = new Route([pool], DEV_USDC_TOKEN, DEV_USDT_TOKEN); // the first token is the token in, the second is the token out 
        
        // Get quote
        const quoterContract = new ethers.Contract(
            DEV_QUOTER_CONTRACT_ADDRESS,
            QuoterV2ABI.abi,
            provider
        );

        const params = {
            tokenIn: DEV_USDC_TOKEN.address,
            tokenOut: DEV_USDT_TOKEN.address,
            fee: fee,
            amountIn: ethers.utils.parseUnits('10', DEV_USDC_TOKEN.decimals),
            sqrtPriceLimitX96: 0, // Sets the price limit for the quote. 0 means no price limit.
        }
        console.log('Amount in:', params.amountIn.toString());
        // The quoteExactInputSingle function should be a view function, but it is not
        // So we use callStatic feature to ask node to execute the function without sending a transaction
        const quotedAmounts = await quoterContract.callStatic.quoteExactInputSingle(params, {value: 0});
        console.log('Quoted amount out:', quotedAmounts.amountOut.toString());

        // Create trade 
        const uncheckedTrade = Trade.createUncheckedTrade({
            route: route,
            inputAmount: CurrencyAmount.fromRawAmount(DEV_USDC_TOKEN, params.amountIn.toString()),
            outputAmount: CurrencyAmount.fromRawAmount(DEV_USDC_TOKEN, JSBI.BigInt(quotedAmounts[0])),
            tradeType: TradeType.EXACT_INPUT, // Flag to show that we want to swap exact input amount. EXACT_OUTPUT is also available
        });
        console.log('Trade input amount:', uncheckedTrade.inputAmount.toSignificant(6));
        console.log('Trade output amount:', uncheckedTrade.outputAmount.toSignificant(6));
        console.log('Trade price:', uncheckedTrade.executionPrice.toSignificant(6));
        console.log('Trade impact:', uncheckedTrade.priceImpact.toSignificant(6));

        // Execute trade
        // get aproval for USDC token transfer
        const usdcContract = new ethers.Contract(
            DEV_USDT_TOKEN.address,
            ERC20_ABI,
            wallet
        )

        const usdcApproval = await usdcContract.approve(
            DEV_SWAP_ROUTER_CONTRACT_ADDRESS,
            ethers.utils.parseUnits('100', DEV_USDC_TOKEN.decimals)
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
            DEV_SWAP_ROUTER_CONTRACT_ADDRESS,
            SwapRouter.abi,
            wallet
        );

        const exactInputSingleParams = {
            tokenIn: DEV_USDC_TOKEN.address,
            tokenOut: DEV_USDT_TOKEN.address,
            fee: fee,
            recipient: wallet.address,
            deadline: options.deadline,
            amountIn: params.amountIn.toString(),
            amountOutMinimum: 1,
            sqrtPriceLimitX96: 0,
        }

        console.log('Exact input single params:', exactInputSingleParams);

        // We should manually set the gas price to the exchange transaction (or allow metamask to set it for us) 
        const gasPrice = await provider.getGasPrice();
        console.log('Gas price:', gasPrice.toNumber());

        const swapRouterExactInputSingle = await swapRouterContract.exactInputSingle(exactInputSingleParams, { gasPrice: gasPrice });
        console.log('SwapRouter exactInputSingle result:', swapRouterExactInputSingle);
        const result = await swapRouterExactInputSingle.wait();
        console.log('SwapRouter exactInputSingle tx result:', result.status);
        
    } catch (e) {
        console.error(e);
    }
}

main();

 
