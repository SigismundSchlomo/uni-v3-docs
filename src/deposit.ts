import ethers from 'ethers';
import sAMB from './sAMB.json';


const provider = new ethers.providers.JsonRpcProvider('');
const wallet = new ethers.Wallet('0x', provider);

const contract = new ethers.Contract(
    '',
    sAMB.abi,
    provider
);


async function main() {
    const tx = await contract.deposit([],{ signer: wallet, value: ethers.utils.parseEther('1.0')});
    console.log(tx);
    const receipt = await tx.wait();
    console.log(receipt);
}

main();
