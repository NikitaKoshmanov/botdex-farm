const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const RocketPropellant = artifacts.require('RocketPropellant');
const FuelBar = artifacts.require('FuelBar');
const MasterBotdex = artifacts.require('MasterBotdex');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('MasterBotdex', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.propellant = await RocketPropellant.new({ from: minter });
        this.fuel = await FuelBar.new(this.propellant.address, { from: minter });
        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
        this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
        this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
        this.refiner = await MasterBotdex.new(this.propellant.address, this.fuel.address, dev, '1000', '100', { from: minter });
        await this.propellant.transferOwnership(this.refiner.address, { from: minter });
        await this.fuel.transferOwnership(this.refiner.address, { from: minter });

        await this.lp1.transfer(bob, '2000', { from: minter });
        await this.lp2.transfer(bob, '2000', { from: minter });
        await this.lp3.transfer(bob, '2000', { from: minter });

        await this.lp1.transfer(alice, '2000', { from: minter });
        await this.lp2.transfer(alice, '2000', { from: minter });
        await this.lp3.transfer(alice, '2000', { from: minter });
    });
    it('real case', async () => {
      this.lp4 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp5 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp6 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      this.lp7 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: minter });
      this.lp8 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: minter });
      this.lp9 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: minter });
      await this.refiner.add('2000', this.lp1.address, true, { from: minter });
      await this.refiner.add('1000', this.lp2.address, true, { from: minter });
      await this.refiner.add('500', this.lp3.address, true, { from: minter });
      await this.refiner.add('500', this.lp3.address, true, { from: minter });
      await this.refiner.add('500', this.lp3.address, true, { from: minter });
      await this.refiner.add('500', this.lp3.address, true, { from: minter });
      await this.refiner.add('500', this.lp3.address, true, { from: minter });
      await this.refiner.add('100', this.lp3.address, true, { from: minter });
      await this.refiner.add('100', this.lp3.address, true, { from: minter });
      assert.equal((await this.refiner.poolLength()).toString(), "10");

      await time.advanceBlockTo('170');
      await this.lp1.approve(this.refiner.address, '1000', { from: alice });
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '0');
      await this.refiner.deposit(1, '20', { from: alice });
      await this.refiner.withdraw(1, '20', { from: alice });
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '263');

      await this.propellant.approve(this.refiner.address, '1000', { from: alice });
      await this.refiner.enterStaking('20', { from: alice });
      await this.refiner.enterStaking('0', { from: alice });
      await this.refiner.enterStaking('0', { from: alice });
      await this.refiner.enterStaking('0', { from: alice });
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '993');
      // assert.equal((await this.refiner.getPoolPoint(0, { from: minter })).toString(), '1900');
    })


    it('deposit/withdraw', async () => {
      assert.equal(await this.refiner.add.estimateGas('1000', this.lp1.address, true, { from: minter }), 121247)
      await this.refiner.add('1000', this.lp1.address, true, { from: minter });
      await this.refiner.add('1000', this.lp2.address, true, { from: minter });
      await this.refiner.add('1000', this.lp3.address, true, { from: minter });

      assert.equal(await this.lp1.approve.estimateGas(this.refiner.address, '100', { from: alice }), 44055)
      await this.lp1.approve(this.refiner.address, '100', { from: alice });

      assert.equal(await this.refiner.deposit.estimateGas(1, '20', { from: alice }), 99282)
      await this.refiner.deposit(1, '20', { from: alice });
      await this.refiner.deposit(1, '0', { from: alice });
      await this.refiner.deposit(1, '40', { from: alice });
      await this.refiner.deposit(1, '0', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1940');

      assert.equal(await this.refiner.withdraw.estimateGas(1, '10', { from: alice }), 130319)
      await this.refiner.withdraw(1, '10', { from: alice });
      assert.equal((await this.lp1.balanceOf(alice)).toString(), '1950');
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '999');
      assert.equal((await this.propellant.balanceOf(dev)).toString(), '100');

      await this.lp1.approve(this.refiner.address, '100', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
      await this.refiner.deposit(1, '50', { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '1950');
      await this.refiner.deposit(1, '0', { from: bob });
      assert.equal((await this.propellant.balanceOf(bob)).toString(), '125');
      await this.refiner.emergencyWithdraw(1, { from: bob });
      assert.equal((await this.lp1.balanceOf(bob)).toString(), '2000');
    })

    it('staking/unstaking', async () => {
      await this.refiner.add('1000', this.lp1.address, true, { from: minter });
      await this.refiner.add('1000', this.lp2.address, true, { from: minter });
      await this.refiner.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.refiner.address, '10', { from: alice });
      await this.refiner.deposit(1, '2', { from: alice }); //0
      await this.refiner.withdraw(1, '2', { from: alice }); //1

      await this.propellant.approve(this.refiner.address, '250', { from: alice });

      assert.equal(await this.refiner.enterStaking.estimateGas('240', { from: alice }), 148100)
      await this.refiner.enterStaking('240', { from: alice }); //3
      assert.equal((await this.fuel.balanceOf(alice)).toString(), '240');
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '10');
      await this.refiner.enterStaking('10', { from: alice }); //4
      assert.equal((await this.fuel.balanceOf(alice)).toString(), '250');
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '249');
      assert.equal(await this.refiner.leaveStaking.estimateGas('240', { from: alice }), 144358)
      await this.refiner.leaveStaking(250);
      assert.equal((await this.fuel.balanceOf(alice)).toString(), '0');
      assert.equal((await this.propellant.balanceOf(alice)).toString(), '749');

    });


    it('update multiplier', async () => {
      await this.refiner.add('1000', this.lp1.address, true, { from: minter });
      await this.refiner.add('1000', this.lp2.address, true, { from: minter });
      await this.refiner.add('1000', this.lp3.address, true, { from: minter });

      await this.lp1.approve(this.refiner.address, '100', { from: alice });
      await this.lp1.approve(this.refiner.address, '100', { from: bob });
      await this.refiner.deposit(1, '100', { from: alice });
      await this.refiner.deposit(1, '100', { from: bob });
      await this.refiner.deposit(1, '0', { from: alice });
      await this.refiner.deposit(1, '0', { from: bob });

      await this.propellant.approve(this.refiner.address, '100', { from: alice });
      await this.propellant.approve(this.refiner.address, '100', { from: bob });
      await this.refiner.enterStaking('50', { from: alice });
      await this.refiner.enterStaking('100', { from: bob });

      await this.refiner.updateMultiplier('0', { from: minter });

      await this.refiner.enterStaking('0', { from: alice });
      await this.refiner.enterStaking('0', { from: bob });
      await this.refiner.deposit(1, '0', { from: alice });
      await this.refiner.deposit(1, '0', { from: bob });

      assert.equal((await this.propellant.balanceOf(alice)).toString(), '700');
      assert.equal((await this.propellant.balanceOf(bob)).toString(), '150');

      await time.advanceBlockTo('265');

      await this.refiner.enterStaking('0', { from: alice });
      await this.refiner.enterStaking('0', { from: bob });
      await this.refiner.deposit(1, '0', { from: alice });
      await this.refiner.deposit(1, '0', { from: bob });

      assert.equal((await this.propellant.balanceOf(alice)).toString(), '700');
      assert.equal((await this.propellant.balanceOf(bob)).toString(), '150');

      await this.refiner.leaveStaking('50', { from: alice });
      await this.refiner.leaveStaking('100', { from: bob });
      await this.refiner.withdraw(1, '100', { from: alice });
      await this.refiner.withdraw(1, '100', { from: bob });

    });

    it('should allow dev and only dev to update dev', async () => {
        assert.equal((await this.refiner.devaddr()).valueOf(), dev);
        await expectRevert(this.refiner.dev(bob, { from: bob }), 'dev: wut?');
        await this.refiner.dev(bob, { from: dev });
        assert.equal((await this.refiner.devaddr()).valueOf(), bob);
        await this.refiner.dev(alice, { from: bob });
        assert.equal((await this.refiner.devaddr()).valueOf(), alice);
    })
});
