const { assert } = require("chai");

const RocketPropellant = artifacts.require('RocketPropellant');

contract('RocketPropellant', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.propellant = await RocketPropellant.new({ from: minter });
    });


    it('mint', async () => {
        assert.equal(await this.propellant.mint.estimateGas(alice, 1000, { from: minter }), 67526);
        await this.propellant.mint(alice, 1000, { from: minter });
        assert.equal((await this.propellant.balanceOf(alice)).toString(), '1000');
    })
});
