import { ethers } from 'ethers'
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { 
    DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    DEV_PROVIDER,
    DEV_SIGNER
} from './constants'


const wallet = DEV_SIGNER

async function main() {
    try {
        const nfpmContract = new ethers.Contract(
            DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
            INONFUNGIBLE_POSITION_MANAGER.abi,
            DEV_PROVIDER
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
