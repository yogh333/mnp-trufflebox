# mnp-trufflebox

![This is an image](assets/images/still-albert-veldhuis.jpg)

MNW smart contracts and React-based Dapp

This is a React Truffle box project: for more information, please check http://trufflesuite.com/boxes/react/index.html

This repository contains all the MNW smart contracts (in /contracts), along with a React.js front-end (in /client).

## Online demo
https://mnp-app.herokuapp.com/

Available for mumbai (Polygon testnet)

Players must have MATIC to pay transactions.

MATIC faucet
https://faucet.polygon.technology/

See [Deployed addresses](DEPLOYED_ADDRESSES.md)

## Security reports
See Slither analysis at [`feature/security` branch](https://github.com/jcaporossi/mnp-trufflebox/blob/feature/security/README.md)

## Use of Chainlink VRF oracle for secure randomness
See [explanations there](AVOIDING_COMMON_ATTACKS.md)

# For developers
## developer documents
See [docs/devdoc/](docs/devdoc/)

## user documents
See [docs/userdoc/](docs/userdoc/)

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
See [explanations there](test/TESTS_EXPLICATION.md)

```
truffle test
```

## Migration

### On mumbai
fill `.env` file.

Don't forget, deployer account must have MATIC on Mumbai network

MATIC faucet
https://faucet.polygon.technology/

```
truffle migrate --network mumbai
```

After deployment, give some LINK to Board and Bank contracts.<br/>
LINK faucet https://faucets.chain.link

### Locally, not on mumbai
```
truffle migrate
```


## Front-end
To launch React front-end

```
cd client
npm start
```
### Locally, not on mumbai
change rename replace `App.js` component with `App.local.js`