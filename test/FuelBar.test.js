const { advanceBlockTo } = require('@openzeppelin/test-helpers/src/time');
const { assert } = require('chai');
const RocketPropellant = artifacts.require('RocketPropellant');
const FuelBar = artifacts.require('FuelBar');

contract('FuelBar', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.propellant = await RocketPropellant.new({ from: minter });
    this.fuel = await FuelBar.new(this.propellant.address, { from: minter });
  });

  it('mint', async () => {
    await this.fuel.mint(alice, 1000, { from: minter });
    assert.equal((await this.fuel.balanceOf(alice)).toString(), '1000');
  });

  it('burn', async () => {
    await advanceBlockTo('650');
    await this.fuel.mint(alice, 1000, { from: minter });
    await this.fuel.mint(bob, 1000, { from: minter });
    assert.equal((await this.fuel.totalSupply()).toString(), '2000');
    await this.fuel.burn(alice, 200, { from: minter });

    assert.equal((await this.fuel.balanceOf(alice)).toString(), '800');
    assert.equal((await this.fuel.totalSupply()).toString(), '1800');
  });

  it('safeBOTTransfer', async () => {
    assert.equal(
      (await this.propellant.balanceOf(this.fuel.address)).toString(),
      '0'
    );
    await this.propellant.mint(this.fuel.address, 1000, { from: minter });
    await this.fuel.safeBOTTransfer(bob, 200, { from: minter });
    assert.equal((await this.propellant.balanceOf(bob)).toString(), '200');
    assert.equal(
      (await this.propellant.balanceOf(this.fuel.address)).toString(),
      '800'
    );
    await this.fuel.safeBOTTransfer(bob, 2000, { from: minter });
    assert.equal((await this.propellant.balanceOf(bob)).toString(), '1000');
  });
});
