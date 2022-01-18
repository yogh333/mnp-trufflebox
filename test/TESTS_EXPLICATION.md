# Tests Explication

Ce dossier contient tous les tests unitaires Truffle pour tester les contrats intelligents dans le dossier /contracts.

## Fichier de test : BoardRandom.test.js
<br/>
Dans ce fichier, nous allons trouver les différents tests relatifs à la génération de l'aléatoire pour le lancer de dé.
<br/>
**A. Test of the requestRandomNumber function**
<br/>
- **Description :** tentative d'appel de la fonction play() si le contrat n'a pas assez de fonds.
  [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

- **Raison :** vérifier le revert de la balance du contrat en LINK si celle-ci est inférieure aux frais de transactions de l'oracle simulé en local.

```sh
✓ 2. Reverts if the LINK balance of the contract is lower than the fee
```


- **Description :** simulation de l'appel de la fonction play() si le contrat a assez de fonds.
  [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

- **Raison :** vérifier que la balance du contrat en LINK possède assez de fonds pour payer les frais de transactions de l'oracle simulé en local.

```sh
✓ 3. Pass if the LINK balance of the contract has enough fee
```

<br/>


**C. Test of the function play**


- **Description :** nous interdisons de jouer si le pion n'est pas enregistré.
  [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

- **Raison :** vérifier que nous ne pouvons pas commencer la partie si le pion n'a pas été enregistré.

```sh
✓ 10. Reverts playing if the paw is not registered
```


- **Description :** nous testons la corrélation du résultat du lancer de dés avec la nouvelle position que le pion va avoir
  [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

- **Raison :** vérifier que le déplacement du pion est cohérent.

```sh
✓ 11. Test random number related to the movement of the pawn
```


- **Description :** pour avoir des tests complets sur les modulos, nous testons toutes les possibilités de déplacement du pion en rapport avec des random simulés donc fixés entre 0 et 24.
  [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

- **Raison :** vérifier que le déplacement du pion est cohérent.

```sh
12.a. We test the modulos and the movement of the pawn -- random = 0 (509ms)
      ✓ 12.b. We test the modulos and the movement of the pawn -- random = 1 
      ✓ 12.c. We test the modulos and the movement of the pawn -- random = 2 
      ✓ 13. We test the modulos and the movement of the pawn -- random = 3 
      ✓ 14. We test the modulos and the movement of the pawn -- random = 4 
      ✓ 15. We test the modulos and the movement of the pawn -- random = 5 
      ✓ 16. We test the modulos and the movement of the pawn -- random = 6
      ✓ 17. We test the modulos and the movement of the pawn -- random = 7 
      ✓ 18. We test the modulos and the movement of the pawn -- random = 8 
      ✓ 19. We test the modulos and the movement of the pawn -- random = 9 
      ✓ 20. We test the modulos and the movement of the pawn -- random = 10 
      ✓ 21. We test the modulos and the movement of the pawn -- random = 11 
      ✓ 22. We test the modulos and the movement of the pawn -- random = 12 
      ✓ 23. We test the modulos and the movement of the pawn -- random = 13 
      ✓ 24. We test the modulos and the movement of the pawn -- random = 14 
      ✓ 25. We test the modulos and the movement of the pawn -- random = 15 
      ✓ 26. We test the modulos and the movement of the pawn -- random = 16 
      ✓ 27. We test the modulos and the movement of the pawn -- random = 17 
      ✓ 28. We test the modulos and the movement of the pawn -- random = 18 
      ✓ 29. We test the modulos and the movement of the pawn -- random = 19 
      ✓ 30. We test the modulos and the movement of the pawn -- random = 20 
      ✓ 31. We test the modulos and the movement of the pawn -- random = 21 
      ✓ 32. We test the modulos and the movement of the pawn -- random = 22 
      ✓ 33. We test the modulos and the movement of the pawn -- random = 23 
      ✓ 34. We test the modulos and the movement of the pawn -- random = 24 
```
