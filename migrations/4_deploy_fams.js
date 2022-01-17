const BN = require('bn.js');

require('dotenv').config();
const {
    DEV,
    PR1PERBLOCK,
    STARTBLOCK
} = process.env;

const BOTToken = artifacts.require("RocketPropellant");
const FuelBar = artifacts.require("FuelBar");
const MasterBotdex = artifacts.require("MasterBotdex");


module.exports = async function (deployer, network) {
    if (network == "bscTestnet" || network == "development") {

    let BOTTokenInst = await BOTToken.deployed();
    let FuelBarInst = await FuelBar.deployed();
    
    await deployer.deploy(MasterBotdex, BOTTokenInst.address, FuelBarInst.address, DEV, PR1PERBLOCK, STARTBLOCK);

    let MasterBotdexInst = await MasterBotdex.deployed();
    await MasterBotdexInst.transferOwnership(FuelBarInst.address);
    }
};