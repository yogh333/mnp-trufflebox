# Avoiding Common Attacks

## Random Numbers Generation (dices roll)

Generating random numbers in blockchain is an well known issue. To get further details please refer to:

1. [Solidity Pitfalls](https://betterprogramming.pub/how-to-generate-truly-random-numbers-in-solidity-and-blockchain-9ced6472dbdf)
2. [How to Generate Truly Random Numbers in Solidity and Blockchain](https://betterprogramming.pub/how-to-generate-truly-random-numbers-in-solidity-and-blockchain-9ced6472dbdf)
3. [Generating Randomness In Blockchain: Verifiable Random Function](https://hackernoon.com/generating-randomness-in-blockchain-verifiable-random-function-ft1534ud)

[Chainlink VRF](https://docs.chain.link/docs/chainlink-vrf/) Verifiable Random Function is a provably-fair and veriafiable source of randomness.

## Bugs logiques

Des tests unitaires ont été créés pour vérifier que le comportement du contrat est conforme aux attentes. Il suffit de lancer la commande `truffle test`. Les normes et les meilleures pratiques de Solidity ont été prises en compte lors du développement des contrats, en utilisant la documentation de Solidity comme guide.

## Tx.origin

`msg.sender` a été utilisée dans les contrats pour faire référence à celui qui appelle la fonction. `tx.origin` n'est pas recommandé car les développeurs d'Ethereum ont déclaré publiquement qu'il n'est pas pertinent et qu'il est peu probable qu'il soit utilisable donc nous ne l'avons pas utilisé dans les contrats.

## Default Visibilities

Nous avons spécifié la visibilité de toutes les fonctions dans les contracts pour se protéger contre la vulnérabilité `Default Visibilities`

## Restrictions d'accès

Les appels de fonctions ont été sécurisés par l'utilisation de `modifiers`, `require()` pour tester les conditions et lancer des exceptions et `revert()` pour se protéger contre les comportements inattendus.
