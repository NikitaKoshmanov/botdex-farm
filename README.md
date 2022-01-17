# Botdex Farm

### Prerequisites
---

[Npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

[Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation) 

Test in Truffle v5.3.3 and Npm v7.19.1

### Installing
---
```bash
~$ git clone https://github.com/Rock-n-Block/BotdexSwap-farm.git
~$ cd BotdexSwap-farm
~$ npm install
```

#### Configuration
---
```bash
~$ mv env.example .env # 
```

### Run
---
```bash
~$ truffle test # run tests
```

### Test in testnet
---
```bash
~$ truffle migrate -f 2 --to 7 --network kovan # deploy BOT, Fuel, Farm, Pool, Auto Pool, multicall lib
~$ truffle run verify RocketPropellant FuelBar MasterBotdex BotdexVault SmartChefFactory Multicall2 --network kovan # verify BOT, Fuel, MasterBotdex, BotdexVault, SmartChef, Multicall2
```

### Deployed contract
---

Contract for BOT

Deployed on kovan:
[0x6E32B62576B6344226EDd2A8C347f54BfE5deb74](https://kovan.etherscan.io/address/0x6E32B62576B6344226EDd2A8C347f54BfE5deb74)

Contract for FuelBar

Deployed on kovan:
[0x251a340069189d5507c81325df5520BA2Afb1089](https://kovan.etherscan.io/address/0x251a340069189d5507c81325df5520BA2Afb1089)

Contract for farms and manual BOT pool

Deployed on kovan:
[0x318D824BB3DD82c4b062adbC6Fe561cE4d95a3B4](https://kovan.etherscan.io/address/0x318D824BB3DD82c4b062adbC6Fe561cE4d95a3B4)

Contract for auto BOT pool

Deployed on kovan:
[0x1F160671B85b7488141Dce8e39B606429D681f19](https://kovan.etherscan.io/address/0x1F160671B85b7488141Dce8e39B606429D681f19)

Example pool

Deployed on kovan:
[0xd878d796a49ef940351a1569ae4af80142bc5959](https://kovan.etherscan.io/address/0xd878d796a49ef940351a1569ae4af80142bc5959)

Multicall2

Deployed on kovan:
[0x52dcE21E7923890c338C91FDDfa5a930dc58B553](https://kovan.etherscan.io/address/0x52dcE21E7923890c338C91FDDfa5a930dc58B553)
