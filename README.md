# mnp-trufflebox

![This is an image](assets/images/still-albert-veldhuis.jpg)

MNW smart contracts and React-based Dapp

This is a React Truffle box project: for more information, please check http://trufflesuite.com/boxes/react/index.html

This repository contains all the MNW smart contracts (in /contracts), along with a React.js front-end (in /client).

## Online demo
https://mnp-app.herokuapp.com/

Available for mumbai testnet

Players must have MATIC to pay transactions.

MATIC faucet
https://faucet.polygon.technology/

See [Deployed addresses](DEPLOYED_ADDRESSES.md)

## Security reports
See Slither analysis at [`security` branch](https://github.com/jcaporossi/mnp-trufflebox/tree/feature/security)

## Use of Chainlink VRF oracle for randomness
### ChainLink workflow
1- Receive request
2- Generating the random and sending crypto proofs to the VRF contract
3- Verify and send random number to our Board contract

### Our workflow
1- Send request via Bank.


## Cloning the project

In an empty local directory

```
git clone https://github.com/jcaporossi/mnp-trufflebox.git
```

## Installation

After cloning the project, install dependencies with

```
cd mnp-trufflebox
npm install
cd client
npm install
cd ..
```

## Compilation

To compile all smart contracts:

```
truffle compile
```

## Local node

Start a local node

Open a shell window and launch

```
ganache-cli
```

## Unit Tests

To launch unit tests associated with each smart contracts, in another terminal windows, at root of the project

```
truffle test
```

## Migration

Don't forget, deployer account must have MATIC on Mumbai network

MATIC faucet
https://faucet.polygon.technology/

```
truffle migrate
```

After deployment, give some LINK to Board and Bank contracts.<br/>
LINK faucet https://faucets.chain.link

## Front-end

To launch React front-end

```
cd client
npm start
```

## developer documents
`docs/devdocs/`

## user documents
`docs/userdocs/`