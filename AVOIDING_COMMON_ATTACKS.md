# Avoiding Common Attacks
## Security reports
See Slither analysis at [`security` branch](https://github.com/jcaporossi/mnp-trufflebox/tree/feature/security)

## Génération de nombres aléatoires (dices roll)

La génération de nombres aléatoires dans la blockchain est un problème bien connu. Pour obtenir plus de détails, veuillez-vous référer à :

1. [Solidity Pitfalls](https://betterprogramming.pub/how-to-generate-truly-random-numbers-in-solidity-and-blockchain-9ced6472dbdf)
2. [How to Generate Truly Random Numbers in Solidity and Blockchain](https://betterprogramming.pub/how-to-generate-truly-random-numbers-in-solidity-and-blockchain-9ced6472dbdf)
3. [Generating Randomness In Blockchain: Verifiable Random Function](https://hackernoon.com/generating-randomness-in-blockchain-verifiable-random-function-ft1534ud)

[Chainlink VRF](https://docs.chain.link/docs/chainlink-vrf/) Verifiable Random Function is a provably-fair and veriafiable source of randomness.

Dans un premier temps, nous avons pris le parti de générer le jet de dés par une fonction ```getRandomKeccak256()```, afin de progresser par étapes dans la complexité, qui va utiliser les différents arguments suivants : ```block.difficulty```, ```block.timestamp``` dont la valeur est recalculée à chaque changement bloc et l'adresse de l'utilisateur courant ```msg.sender```.

Dans un deuxième temps, nous prévoyons d'utiliser la fonctionnalité VRF de l'oracle Chainlink pour fiabiliser le lancer de dé.

## Use of Chainlink VRF oracle for randomness
### ChainLink workflow
1. Receive request
2. Generating the random and sending crypto proofs to the VRF contract
3. Verify and send random number to our Board contract

### Our workflow
1. Send request  
   Bank.`rollDices()` -> Board.`play()` -> Board.requestRandomNumber() -> VRFConsumerBase.requestRandomness()
2. Receive random number  
   ChainLink VRF Coordinator call  
   Board.rawFulfillRandomness() -> Board.fulfillRandomness() -> Board.gameStrategist()
#### /!\ ChainLink limit callback function to 200k gas
Low gas strategy is to record booleans in Board.fulfillRandomness() via gameStrategist()

These flags will be managed in the front.
The necessary checks and calculations will be made in the contract at the time of a transaction made by the player.
That way we don't overload the callback called by Chainlink and we charge the user fees.

#### Retrieving gas used
search `RandomReady` event for Board contract in mumbai explorer
https://mumbai.polygonscan.com/address/0x8d4d0C5da875f1396c1974C114Eb920871cCd8f0#events
event no is '0x1954c6845304788fb449c20d6a568c6672d0d11585f9d8f32673fba15c9cbf22'
find a transaction related to this event
https://mumbai.polygonscan.com/tx/0x13dfabb80bb5d17d78c667dc7d95076a4c4951ed11fafc4250180d124db8076c  
We find :  
Gas Used by Transaction: 109,418
WELL DONE... is less than 200k

## Bugs logiques

Des tests unitaires ont été créés pour vérifier que le comportement du contrat est conforme aux attentes. Il suffit de lancer la commande `truffle test`. Les normes et les meilleures pratiques de Solidity ont été prises en compte lors du développement des contrats, en utilisant la documentation de Solidity comme guide.

## Tx.origin

`msg.sender` a été utilisée dans les contrats pour faire référence à celui qui appelle la fonction. `tx.origin` n'est pas recommandé car les développeurs d'Ethereum ont déclaré publiquement qu'il n'est pas pertinent et qu'il est peu probable qu'il soit utilisable donc nous ne l'avons pas utilisé dans les contrats.

## Default Visibilities

Nous avons spécifié la visibilité de toutes les fonctions dans les contracts pour se protéger contre la vulnérabilité `Default Visibilities`

## Restrictions d'accès

Les appels de fonctions ont été sécurisés par l'utilisation de `modifiers`, `require()` pour tester les conditions et lancer des exceptions et `revert()` pour se protéger contre les comportements inattendus.

