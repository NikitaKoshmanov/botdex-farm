const HDWalletProvider = require('truffle-hdwallet-provider');

require('dotenv').config();
const {
    ETHERSCAN_API_KEY,
    BSCSCAN_API_KEY,
    MNEMONIC,
    DEPLOY_GAS_LIMIT,
    DEPLOY_GAS_PRICE,
    INFURA_ID_PROJECT
} = process.env;

const Web3 = require("web3");
const web3 = new Web3();

module.exports = {
    plugins: ['truffle-plugin-verify', 'truffle-contract-size', "solidity-coverage"],

    api_keys: {
        etherscan: ETHERSCAN_API_KEY,
        bscscan: BSCSCAN_API_KEY
    },

    networks: {
        //  development: {
        //     host: "127.0.0.1",
        //     port: 7545,
        //     network_id: "5777",
        //     gas: 12000000
        // }, 
        kovan: {
            provider: () => new HDWalletProvider(MNEMONIC, "https://kovan.infura.io/v3/" + INFURA_ID_PROJECT),
            network_id: 42,
            confirmations: 1,
            gas: DEPLOY_GAS_LIMIT,
            skipDryRun: true
        },
        bscTestnet: {
            provider: () => new HDWalletProvider(MNEMONIC, "https://data-seed-prebsc-1-s3.binance.org:8545/"),
            network_id: 97,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        // bsc: {
        //     provider: () => new HDWalletProvider(MNEMONIC, "https://bsc-dataseed.binance.org"),
        //     network_id: 56,
        //     confirmations: 2,
        //     gasPrice: web3.utils.toWei(DEPLOY_GAS_PRICE, 'gwei'),
        //     gas: DEPLOY_GAS_LIMIT,
        //     timeoutBlocks: 200,
        //     skipDryRun: false
        // }
    },

    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions : {
            onlyCallMethod : false,
            excludeContracts : ['Migrations']
        } // See options below
    },

    compilers: {
        solc: {
            version: '0.8.7',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};