# mnp-trufflebox

![This is an image](assets/images/still-albert-veldhuis.jpg)

MNW smart contracts and React-based Dapp

This is a React Truffle box project: for more information, please check http://trufflesuite.com/boxes/react/index.html

This repository contains all the MNW smart contracts (in /contracts), along with a React.js front-end (in /client).

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

```
truffle migrate
```

## Front-end

To launch React front-end

```
cd client
npm start
```
