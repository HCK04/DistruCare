% DisrtuCare : tout comprendre pour bien l'expliquer
% Guide de présentation à destination de l'équipe

# À quoi sert ce document

Ce guide a pour but de vous donner tout ce qu'il faut pour comprendre le projet DisrtuCare de bout en bout, puis pour l'expliquer simplement à vos collègues. Il part de zéro, sans supposer de connaissances techniques préalables. Chaque notion est d'abord expliquée par une image ou une analogie, puis précisée. Vous y trouverez aussi un fil conducteur de présentation, un petit lexique pour répondre aux questions, l'histoire des difficultés rencontrées, et une antisèche d'une page à garder sous les yeux.

# 1. Le projet en une phrase

DisrtuCare est un distributeur automatique de médicaments, accompagné d'une application mobile, qui aide une personne, en particulier une personne âgée, à prendre ses médicaments à la bonne heure, et qui enregistre automatiquement si elle les a pris.

Si vous ne deviez retenir qu'une chose, c'est celle-ci : un objet physique délivre la dose au bon moment, et un téléphone garde la mémoire de tout ce qui se passe.

# 2. Le problème que l'on résout

Beaucoup de personnes, surtout âgées, oublient de prendre leurs médicaments, ou les prennent en double par confusion. On appelle observance le fait de bien suivre son traitement. Une mauvaise observance peut avoir des conséquences réelles sur la santé.

Les solutions existantes, comme les piluliers à cases, aident à organiser les prises, mais elles ne rappellent rien, ne distribuent rien toutes seules, et surtout ne savent pas si la personne a réellement pris sa dose. Personne, ni le patient ni sa famille, n'a de trace fiable de ce qui a été pris.

DisrtuCare répond à ce manque de trois manières. D'abord il distribue la dose tout seul au bon moment. Ensuite il rappelle la prise. Enfin, et c'est le point clé, il enregistre automatiquement la prise quand la personne confirme, ce qui construit un suivi sans aucune saisie manuelle.

# 3. L'idée centrale : deux moitiés qui coopèrent

Le système est fait de deux parties qui travaillent ensemble.

La première est le distributeur, c'est la partie matérielle. On peut la voir comme les mains et la montre du système. Elle connaît l'heure, fait tourner un barillet pour libérer une dose, et reçoit la confirmation de la personne.

La seconde est l'application mobile, c'est la partie logicielle. On peut la voir comme le carnet de suivi et le réveil. Elle règle les horaires, rappelle les prises, garde l'historique et montre si le traitement est bien suivi.

Les deux communiquent par le WiFi de la maison. Le point important à faire passer : le distributeur fonctionne tout seul, même si le téléphone est éteint. L'application ajoute la mémoire et le confort, mais elle n'est pas indispensable pour que la dose soit délivrée à l'heure.

# 4. Comment l'expliquer en cinq minutes

Voici un fil conducteur simple pour une présentation rapide.

Commencez par le problème : les gens oublient leurs médicaments, et personne ne sait vraiment s'ils les ont pris. Enchaînez avec l'idée : un distributeur qui agit, et une application qui se souvient. Montrez ensuite le scénario d'une dose : à l'heure prévue, le barillet tourne d'un cran, la dose tombe, la personne appuie sur un bouton, et l'application note automatiquement que la dose a été prise. Terminez par la phrase forte : un simple geste physique met à jour le dossier numérique, sans que la personne ait à toucher un écran.

En cinq minutes, ces quatre points suffisent : le problème, les deux moitiés, le scénario d'une dose, et la phrase forte.

# 5. Le matériel, pièce par pièce

Cette partie décrit chaque composant du distributeur, en partant de zéro.

## 5.1 Le microcontrôleur, le cerveau

Le cœur du distributeur est un microcontrôleur, ici un modèle appelé NodeMCU, de la famille ESP8266. Un microcontrôleur est un tout petit ordinateur, de la taille d'une boîte d'allumettes, qui exécute un programme en boucle. Sa particularité ici est qu'il intègre le WiFi, sans aucune pièce supplémentaire. C'est lui le chef d'orchestre : il regarde l'heure, commande le moteur, surveille le bouton et répond au téléphone. On le branche sur une simple prise par un câble.

Le programme qu'il exécute s'appelle le firmware. C'est un mot important : le firmware, c'est le logiciel qui vit à l'intérieur du distributeur, par opposition à l'application qui vit dans le téléphone.

## 5.2 Le moteur et son pilote, le muscle

Pour libérer une dose, il faut faire tourner un barillet. Le mouvement est assuré par un moteur dit pas à pas, le 28BYJ-48. La différence avec un moteur ordinaire est essentielle : un moteur ordinaire tourne librement, alors qu'un moteur pas à pas avance par tout petits crans que l'on peut compter un par un. C'est exactement ce qu'il faut pour la précision, car on veut amener un compartiment, et un seul, face à l'ouverture.

Le microcontrôleur est trop faible pour alimenter directement le moteur. On intercale donc une petite carte appelée ULN2003, qui sert d'amplificateur entre le cerveau et le muscle. Le microcontrôleur envoie une séquence de signaux, la carte ULN2003 les renforce, et le moteur avance d'un cran à chaque étape. En comptant le nombre de crans, le programme sait précisément de combien le barillet a tourné.

## 5.3 Le barillet, le réducteur et le calcul de la rotation

Le barillet comporte quinze compartiments, un par moment de prise. Entre le moteur et le barillet, on place un réducteur, c'est-à-dire un jeu d'engrenages qui ralentit le mouvement et augmente la force, avec un rapport de sept et demi pour un.

Le calcul est simple à expliquer. Le moteur fait un tour complet en un certain nombre de crans. Compte tenu du réducteur et des quinze compartiments, il faut exactement une demi-rotation du moteur pour avancer d'un compartiment. En crans, cela correspond à deux mille quarante-huit crans. Le programme compte ces crans, puis arrête le moteur pile au bon endroit, et coupe ensuite l'alimentation pour ne pas chauffer inutilement.

Pour expliquer la précision à un collègue, retenez l'image suivante : il y a une double sécurité. La sécurité logicielle, c'est le comptage des crans. La sécurité mécanique, ce sont les cloisons entre compartiments. Les deux ensemble garantissent qu'une seule dose tombe à chaque fois.

## 5.4 Le bouton, la confirmation

Un simple bouton poussoir permet à la personne de confirmer qu'elle a pris sa dose. Une pression suffit. Ce choix est volontaire : pour une personne âgée, un vrai bouton est plus rassurant qu'un écran tactile. Ce geste anodin a pourtant un grand rôle, car c'est lui qui déclenche l'enregistrement automatique de la prise.

## 5.5 L'écran, l'afficheur

Le distributeur possède un petit écran de deux lignes, appelé écran LCD. Il sert à afficher des informations utiles, comme l'adresse du distributeur sur le réseau au démarrage, ou l'horaire programmé. Cet écran est pratique mais pas indispensable, et le système a été conçu pour fonctionner même s'il est absent ou défaillant.

## 5.6 L'horloge, gérée par le logiciel

Point important à bien comprendre : le distributeur n'a pas de module d'horloge matériel dédié. Il garde l'heure tout seul, dans son programme, à la manière d'un chronomètre lancé. Il apprend l'heure exacte du téléphone au moment de la connexion. La conséquence, à expliquer clairement, est qu'il perd l'heure après une coupure de courant, et qu'il attend que le téléphone la lui redonne. Par sécurité, tant qu'il ne connaît pas l'heure de façon fiable, il refuse de distribuer quoi que ce soit, pour ne pas délivrer une dose au mauvais moment.

## 5.7 L'alimentation

L'ensemble est alimenté par une prise. Un point appris à l'usage est que le démarrage du moteur demande beaucoup de courant d'un coup. Si l'alimentation est trop juste, le microcontrôleur peut se réinitialiser. Il faut donc une alimentation suffisante, avec une masse commune à tous les composants.

# 6. L'application mobile

L'application est la partie qui vit dans le téléphone. Elle a été développée avec une technologie appelée React Native, qui permet d'écrire le programme une seule fois et de le faire fonctionner aussi bien sur Android que sur iPhone.

## 6.1 Les quatre écrans

L'application est organisée en quatre onglets. Le tableau de bord montre l'essentiel : la prochaine dose avec un compte à rebours, le respect du traitement sur les trente derniers jours, et les doses du jour avec leur statut. L'historique montre le journal des prises, jour par jour, avec un code couleur. L'écran Appareil sert à se connecter au distributeur. L'écran Réglages réunit les paramètres, à savoir les heures du matin et du soir, le nom du médicament, les rappels et le confort visuel.

## 6.2 La base de données locale

Toutes les informations sont conservées dans le téléphone, dans une petite base de données appelée SQLite. Une base de données est simplement un classeur organisé, où chaque information a sa place. Ici, tout reste sur le téléphone, sans serveur extérieur ni Internet, ce qui protège les données de santé et garantit que l'application fonctionne hors-ligne.

Cette base contient deux tables. La première garde les réglages, sur une seule ligne. La seconde garde le journal des prises, avec une entrée par dose, sa date, son moment et son statut, à savoir prise, en retard ou manquée.

## 6.3 Les rappels

À chaque changement d'horaire, l'application programme quatre rappels par jour : un le matin, un le soir, et deux relances trente minutes plus tard si la prise n'a pas été confirmée. Ces rappels s'affichent même sans Internet.

## 6.4 L'accessibilité

Comme l'application vise des personnes âgées, l'accessibilité a été soignée : grandes polices, fort contraste, grands boutons, code couleur clair. Une fonction de confort visuel permet, d'un seul geste, d'agrandir tout le texte de l'application.

# 7. Le firmware, le programme du distributeur

Le firmware est le programme qui tourne en permanence dans le distributeur. Son fonctionnement est facile à expliquer : il répète sans cesse une boucle qui enchaîne quatre vérifications. Il répond au téléphone si celui-ci demande quelque chose. Il compare l'heure courante aux horaires programmés. Il surveille le bouton. Il entretient la connexion WiFi.

Cette boucle ne se bloque jamais sur une tâche, ce qui rend le distributeur toujours réactif. Les horaires sont par ailleurs conservés dans une mémoire qui résiste aux coupures de courant, de sorte que le distributeur retrouve son réglage après un redémarrage.

# 8. Comment les deux moitiés se parlent

C'est la partie la plus intéressante, et celle qui impressionne le plus. Prenez le temps de bien l'expliquer.

## 8.1 Le WiFi et l'adresse du distributeur

Le téléphone et le distributeur sont sur le même réseau WiFi. Le distributeur se comporte alors comme un petit site web privé : il possède une adresse sur le réseau, et le téléphone s'y connecte pour lui parler. Pour simplifier la vie de l'utilisateur, le distributeur connaît une liste de réseaux, par exemple celui de la maison et un partage de connexion de secours, et il rejoint automatiquement celui qui est disponible.

## 8.2 L'interface de communication, ou API

Pour dialoguer, le distributeur expose une petite liste d'actions que le téléphone peut déclencher à distance. Cet ensemble d'actions s'appelle une API, et chaque action s'appelle un point d'accès, ou endpoint en anglais. Une bonne image est celle d'un menu de restaurant : chaque ligne du menu est une action que l'on peut commander.

Voici les principaux points d'accès, à présenter comme un menu d'actions.

| Action | Ce qu'elle fait |
|---|---|
| Lire l'état | Le téléphone demande au distributeur son heure, ses horaires et son dernier événement |
| Envoyer l'horaire | Le téléphone transmet les heures du matin et du soir et le nom du médicament |
| Régler l'heure | Le téléphone donne l'heure exacte au distributeur |
| Faire tourner le moteur | Le téléphone demande au distributeur d'avancer d'un compartiment, pour vérification |
| Demander un diagnostic | Le téléphone interroge l'état de santé technique du distributeur |

Les messages échangés sont de courts textes au format JSON, qui est simplement une façon standard et lisible d'écrire des informations. Le tout circule par le protocole HTTP, le même que celui des sites web. Vos collègues techniques reconnaîtront là des notions familières du web, ce qui est rassurant : il n'y a rien d'exotique.

## 8.3 Le sondage, ou comment le distributeur prévient le téléphone

Une question naturelle est : comment le téléphone sait-il qu'une dose vient d'être délivrée ? La réponse est simple. Plutôt que le distributeur n'appelle le téléphone, c'est le téléphone qui interroge le distributeur toutes les trois secondes en lui demandant s'il y a du nouveau. Ce mécanisme s'appelle le sondage. Chaque réponse contient un numéro d'événement. Quand ce numéro change, le téléphone comprend qu'un fait nouveau s'est produit et réagit. C'est une approche volontairement simple, bien adaptée à un petit appareil.

# 9. Le scénario complet d'une dose

Voici le déroulement complet, étape par étape. C'est le meilleur moment de votre présentation, car il relie tout ce qui précède.

Étape un, le réglage. Dans l'application, l'utilisateur fixe les heures, par exemple huit heures et vingt heures. L'application enregistre cet horaire, l'envoie au distributeur, et programme les rappels.

Étape deux, la distribution. À l'heure prévue, le distributeur constate que c'est le moment. Le barillet avance d'un compartiment, la dose tombe dans le plateau, et un événement est créé.

Étape trois, la notification. Au même moment, le téléphone affiche son rappel. En interrogeant le distributeur, l'application découvre le nouvel événement et l'inscrit dans son journal.

Étape quatre, la confirmation. La personne prend sa dose et appuie sur le bouton. Un événement de confirmation est créé.

Étape cinq, la trace. L'application capte cette confirmation et enregistre automatiquement la dose comme prise, sans aucune saisie. Le suivi se met à jour tout seul.

La phrase à retenir et à dire à voix haute : un geste physique sur le distributeur met à jour le dossier numérique du patient.

# 10. Petit lexique pour répondre aux questions

Cette section donne des définitions simples, utiles si un collègue vous pose une question pointue.

Un microcontrôleur est un mini-ordinateur intégré dans un objet.

Une broche est un point de connexion sur le microcontrôleur, où l'on branche un fil de composant.

Un moteur pas à pas est un moteur qui avance par crans comptables, au lieu de tourner librement.

Un réducteur est un jeu d'engrenages qui ralentit le mouvement et augmente la force.

Le WiFi est le réseau sans fil de la maison.

Une adresse IP est l'adresse d'un appareil sur le réseau, comme un numéro de rue.

Un serveur est un appareil qui répond à des demandes ; un client est celui qui pose les demandes. Ici le distributeur est le serveur, le téléphone est le client.

Une API est la liste des actions qu'un appareil offre aux autres ; un point d'accès est l'une de ces actions.

HTTP est la langue du web pour échanger ces demandes ; JSON est une façon standard d'écrire les informations échangées.

Le sondage est le fait d'interroger régulièrement un appareil pour savoir s'il y a du nouveau.

Une base de données est un classeur organisé d'informations ; SQLite en est une version légère, stockée dans le téléphone.

Le firmware est le programme qui vit dans le distributeur ; l'application est le programme qui vit dans le téléphone.

# 11. L'histoire des difficultés, et comment on les a résolues

Cette section est précieuse pour montrer le vrai travail d'ingénierie. Elle raconte des problèmes réels et leurs solutions.

La première difficulté venait du démarrage. Certaines broches du microcontrôleur sont spéciales : leur état au moment précis de l'allumage décide si le programme se lance ou non. Le moteur était relié à l'une de ces broches sensibles, ce qui empêchait parfois le démarrage. La solution a été de déplacer ce fil vers une broche neutre, ce qui a rendu le démarrage fiable.

La deuxième difficulté venait du bouton, lui aussi branché sur une broche sensible. Un câblage inadapté maintenait cette broche dans un mauvais état à l'allumage et bloquait le démarrage. La solution a été de câbler le bouton sur les bonnes pattes, en diagonale, pour qu'il n'agisse que lorsqu'on appuie réellement.

La troisième difficulté était la calibration de la rotation. Il a fallu déterminer le nombre exact de crans pour avancer d'un seul compartiment, puis le vérifier à l'œil, jusqu'à ce que chaque case se présente bien face à l'ouverture.

La quatrième difficulté était la connexion WiFi, parfois capricieuse. La solution a été de doter le distributeur d'une liste de réseaux connus, qu'il rejoint automatiquement, et de prévoir des tentatives répétées. On a aussi appris qu'un routeur peut bloquer temporairement un appareil qui se connecte et se déconnecte trop souvent, ce qu'un simple redémarrage du routeur règle.

La cinquième difficulté concernait l'écran, qui pouvait, en cas de mauvais contact, bloquer tout le distributeur. La solution a été de rendre le programme tolérant : il vérifie d'abord la présence de l'écran, et fonctionne normalement même sans lui.

La sixième difficulté était l'alimentation, déjà évoquée : le démarrage du moteur pouvait réinitialiser le microcontrôleur. La solution est une alimentation suffisante, avec une masse commune.

# 12. Questions que vos collègues pourraient poser

Voici des réponses prêtes à l'emploi.

Pourquoi ne pas utiliser le Bluetooth ? Le WiFi était plus simple à mettre en œuvre et à tester avec le téléphone, et le microcontrôleur l'intègre déjà.

Que se passe-t-il si le téléphone est éteint ? Le distributeur continue de fonctionner seul : il connaît l'heure et délivre les doses programmées. Seul le suivi dans l'application est mis en pause, et il se met à jour à la reconnexion.

Et s'il n'y a pas de WiFi ? L'application fonctionne quand même pour consulter l'historique et régler les horaires, car tout est stocké localement. Seul le dialogue en direct avec le distributeur nécessite le réseau.

Comment est-ce sécurisé ? Pour ce prototype, les échanges ne sont pas chiffrés et restent sur le réseau local de la maison. C'est une limite assumée, à renforcer pour un usage élargi.

Pourquoi pas d'horloge matérielle ? Le distributeur utilise une horloge logicielle, mise à l'heure par le téléphone. Ajouter un module d'horloge à pile lui permettrait de garder l'heure tout seul après une coupure.

Combien de doses peut-il contenir ? Le barillet a quinze compartiments, ce qui borne l'autonomie avant de recharger.

Pourquoi un ESP plutôt qu'un autre microcontrôleur ? Parce qu'il intègre le WiFi nativement, ce qui simplifie tout le projet.

# 13. Limites et perspectives

Il est important de présenter aussi les limites, par honnêteté et pour montrer la voie d'amélioration. Le distributeur dépend du téléphone pour connaître l'heure après une coupure ; un module d'horloge à pile lèverait cette dépendance. Les échanges ne sont pas chiffrés ; une version élargie devrait les sécuriser. La capacité est de quinze doses ; elle pourrait être augmentée. L'écran doit être monté dans le bon sens, car ce type d'afficheur ne peut pas retourner son texte. Enfin, des évolutions plus larges sont envisageables, comme une supervision à distance par un proche ou un soignant.

Toutes ces limites s'inscrivent dans le prolongement de l'architecture actuelle, ce qui montre que le dispositif a été conçu pour pouvoir grandir.

# 14. Antisèche d'une page

À garder sous les yeux pendant la présentation.

En une phrase : un distributeur qui délivre la dose à l'heure, et une application qui se souvient de tout.

Les deux moitiés : le distributeur, ce sont les mains et la montre ; l'application, c'est le carnet et le réveil. Elles se parlent par le WiFi.

Le scénario d'une dose en cinq temps : régler, distribuer, notifier, confirmer, tracer. Le geste physique met à jour le dossier numérique.

Les chiffres clés : quinze compartiments, une demi-rotation par compartiment soit deux mille quarante-huit crans, un sondage toutes les trois secondes, deux rappels et deux relances par jour.

Les composants : un microcontrôleur avec WiFi, un moteur pas à pas et son pilote, un barillet à réducteur, un bouton, un écran. Pas de module d'horloge, l'heure vient du téléphone.

La phrase forte à dire : un simple geste physique sur le distributeur met à jour automatiquement le dossier numérique du patient, sans aucune saisie sur écran.
