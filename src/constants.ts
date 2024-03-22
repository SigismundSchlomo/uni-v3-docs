import { ethers } from 'ethers';
import { Token } from '@sigismund/sdk-core'; //TODO: change to usniswap package and create separate package for constants???
import dotenv from 'dotenv';

// Some constants for enviroment. Maybe would be moved to the separate package

dotenv.config();

const privateKey = process.env.PRIVATE_KEY || ethers.constants.AddressZero;

export const DEV_CHAIN_ID = 30746;
export const DEV_V3_CORE_FACTORY_ADDRESS = '0x8631AF99fB2A4aCaffF6Af7C6c5A696ADf163c2a';
export const DEV_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xD3FeB6dCdeA02ecD1FA5127535D2b624eE48b843';
export const DEV_SWAP_ROUTER_CONTRACT_ADDRESS = '0xfe99543dca6Cb549FaF0fb024C41103862ADFFaA';
export const DEV_QUOTER_CONTRACT_ADDRESS = '0xceCd6B1ee8B685457e24Faa52355e8Edf0239Cd5';
export const DEV_QUOTER_V2_CONTRACT_ADDRESS = '0xfe99543dca6Cb549FaF0fb024C41103862ADFFaA';
export const DEV_USDC_TOKEN = new Token(DEV_CHAIN_ID, '0x94F1Ec9c6305e2A457FEBED006405C3cbA2877E3', 18, 'USDC', 'USD Coin');
export const DEV_USDT_TOKEN = new Token(DEV_CHAIN_ID, '0xacA570AF74A0bE1bC776Eb80A0f1D6bfEB696ae0', 18, 'USDT', 'Tether USD');
export const DEV_PROVIDER = new ethers.providers.JsonRpcProvider('https://network.ambrosus-dev.io');
export const DEV_SIGNER = new ethers.Wallet(privateKey, DEV_PROVIDER);

export const TEST_CHAIN_ID = 22040;
export const TEST_V3_CORE_FACTORY_ADDRESS = '0x6bA4F5d2bA8427621f9ab55c6C71504F74A79176';
export const TEST_NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0xADaDDDa32bcb38F9c2863c303886c971B89e4cD4';
export const TEST_SWAP_ROUTER_CONTRACT_ADDRESS = '0xceCd6B1ee8B685457e24Faa52355e8Edf0239Cd5';
export const TEST_QUOTER_CONTRACT_ADDRESS = '0xb9D2678e684F4B6aF104D7BD9e1CDA4A36AdeA91';
export const TEST_USDT_TOKEN = new Token(TEST_CHAIN_ID,'0x55Be7dd776fAbe89d93bAC66ed1cf0Ab31bdd6eB', 18, 'USDT', 'Tether USD');
export const TEST_USDC_TOKEN = new Token(TEST_CHAIN_ID,'0x8c33e9D24eBf3918D37eC2F26BaE044C9fD30Ea9', 18, 'USDC', 'USD Coin'); 
export const TEST_PROVIDER = new ethers.providers.JsonRpcProvider('https://network.ambrosus-test.io');
export const TEST_SIGNER = new ethers.Wallet(privateKey, TEST_PROVIDER);

export const USDC_USDT_FEE = 3000;

export const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

