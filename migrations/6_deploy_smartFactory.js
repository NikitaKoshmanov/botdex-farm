const BN = require('bn.js');

require('dotenv').config();
const {
} = process.env;

const SmartChefFactory = artifacts.require("SmartChefFactory");


module.exports = async function (deployer, network) {
    if (network == "kovan" || network == "development") {

    await deployer.deploy(SmartChefFactory)
    }
};