const BN = require('bn.js');

require('dotenv').config();
const {
    AUTOPOOLADMIN, 
    AUTOPOOLTREASURY
} = process.env;

const BOTToken = artifacts.require("RocketPropellant");
const FuelBar = artifacts.require("FuelBar");
const MasterBotdex = artifacts.require("MasterBotdex");

const BotdexVault = artifacts.require("BotdexVault");


module.exports = async function (deployer, network) {
    if (network == "kovan" || network == "development") {

    let BOTTokenInst = await BOTToken.deployed();
    let FuelBarInst = await FuelBar.deployed();
    let MasterBotdexInst = await MasterBotdex.deployed();

    await deployer.deploy(BotdexVault, BOTTokenInst.address, FuelBarInst.address, MasterBotdexInst.address, AUTOPOOLADMIN, AUTOPOOLTREASURY)
    }
};