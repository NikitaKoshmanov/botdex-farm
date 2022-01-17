const BN = require('bn.js');

require('dotenv').config();
const {
} = process.env;

const BOTToken = artifacts.require("RocketPropellant");
const FuelBar = artifacts.require("FuelBar");


module.exports = async function (deployer, network) {
    if (network == "bscTestnet" || network == "development") {

    let BOTTokenInst = await BOTToken.deployed();
    await deployer.deploy(FuelBar, BOTTokenInst.address);

    let FuelBarInst = await FuelBar.deployed();

    console.log("FuelBar = ", FuelBarInst.address);
    }
};