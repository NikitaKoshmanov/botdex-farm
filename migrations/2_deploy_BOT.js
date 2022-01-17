const BN = require('bn.js');

require('dotenv').config();
const {
} = process.env;

const BOTToken = artifacts.require("RocketPropellant");


module.exports = async function (deployer, network) {
    if (network == "bscTestnet" || network == "development") {

    await deployer.deploy(
        BOTToken
    );


    let BOTTokenInst = await BOTToken.deployed();

    console.log("BOTToken = ", BOTTokenInst.address);
    }
};