import { ethers } from 'ethers'
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from './constants'

const provider = new ethers.providers.JsonRpcProvider('https://network.ambrosus-test.io');
const wallet = new ethers.Wallet('0x72c61543e33446a5c38b79cdecaf6896d43b8fb8df133795d18570bf76a49079', provider);


async function main() {
    try {
        const nfpmContract = new ethers.Contract(
            NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            INONFUNGIBLE_POSITION_MANAGER.abi,
            provider
        )

        const numPositions = await nfpmContract.balanceOf(wallet.address);
        console.log('number of positions', numPositions);

        const calls = []

        for (let i = 0; i < numPositions; i++) {
            calls.push(
                nfpmContract.tokenOfOwnerByIndex(wallet.address, i)
            )
        }

        const positionIds = await Promise.all(calls)

        const positionCalls = []

        for (let id of positionIds) {
            positionCalls.push(
                nfpmContract.positions(id)
            )
        }

        const callResponses = await Promise.all(positionCalls)

        for (let response of callResponses) {
            console.log(response);
        }

    } catch (error) {
        console.error(error)
    }
}

main();
