const BN = require('bn.js');

require('dotenv').config();
const {
} = process.env;

const Lottery = artifacts.require("Lottery");
const LotteryNFT = artifacts.require("LotteryNFT");
const BOTToken = artifacts.require("RocketPropellant");


const MIN_PRICE = 1;
const MAX_NUMBER = 14;
const OWNER = '0x...';
const ADMIN_ADDRESS = OWNER;

module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;

    await deployer.deploy(
        LotteryNFT
    );


    let LotteryNFTInst = await LotteryNFT.deployed();

    console.log("LotteryNFT = ", LotteryNFTInst.address);

    await deployer.deploy(
        Lottery
    );

    let LotteryInst = await Lottery.deployed();

    console.log("Lottery = ", LotteryInst.address);

    let BOTTokenInst = BOTToken.deployed();

    await LotteryInst.initialize(
        BOTTokenInst.address,
        LotteryNFTInst,
        MIN_PRICE,
        MAX_NUMBER,
        OWNER, 
        ADMIN_ADDRESS
    )
};