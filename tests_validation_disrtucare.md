# Chapitre 4 : Tests et validation

Après avoir décrit le fonctionnement du système et l'intégration de ses deux moitiés, ce chapitre s'attache à éprouver le dispositif DisrtuCare de manière organisée. L'objectif n'est plus d'expliquer comment le système est censé fonctionner, mais de vérifier qu'il fonctionne effectivement, et d'en mesurer le comportement dans des conditions proches de l'usage réel.

La démarche de validation suit une logique progressive. On vérifie d'abord chaque organe pris séparément, puis on contrôle l'application, puis la connexion entre les deux moitiés, et enfin le scénario complet d'une dose, du réglage jusqu'à l'enregistrement de la prise. Les résultats sont ensuite rassemblés, les performances analysées, et les limites du système clairement énoncées. Cette distinction entre les résultats bruts et leur interprétation est volontaire, car elle donne à la validation toute sa valeur.

Il convient de préciser d'emblée l'esprit de ces tests. DisrtuCare est un prototype d'aide à l'observance médicamenteuse. Les essais cherchent donc avant tout à confirmer la fiabilité des fonctions essentielles pour le patient, à savoir la distribution correcte d'une dose, la confirmation de la prise et le suivi de l'observance. Les aspects purement techniques sont vérifiés dans la mesure où ils conditionnent ces fonctions essentielles.

## 4.1 Objectifs de la validation

La validation poursuit quatre objectifs principaux. Le premier est de confirmer que le distributeur délivre une dose, et une seule, à l'heure programmée. Le deuxième est de vérifier que l'application enregistre fidèlement les prises et restitue une observance exacte. Le troisième est de s'assurer que la connexion entre le téléphone et le distributeur est fiable et facile à établir. Le quatrième est d'identifier les limites du système, afin de préparer les améliorations futures.

Ces objectifs découlent directement du cahier des charges. Un dispositif destiné à des personnes âgées doit être avant tout sûr, simple et constant. Une distribution imprécise, un suivi erroné ou une connexion capricieuse seraient autant d'obstacles à l'adoption du dispositif. C'est pourquoi la validation insiste particulièrement sur la régularité du comportement, plus encore que sur la rapidité.

La validation joue par ailleurs un rôle important dans la conduite du projet lui-même. C'est en éprouvant le dispositif que plusieurs difficultés ont été révélées, puis comprises et corrigées. Les tests n'ont donc pas seulement servi à constater un résultat final, ils ont accompagné toute la mise au point, en orientant les corrections successives. Cette dimension itérative est caractéristique d'un travail de prototypage, où la frontière entre la réalisation et la validation n'est pas étanche, mais où chaque essai nourrit l'amélioration du dispositif.

## 4.2 Environnement et protocole de test

### 4.2.1 Matériel et logiciel utilisés

Les essais ont été menés avec le distributeur assemblé, comprenant le microcontrôleur, le moteur, son carrousel et le bouton de confirmation, le tout alimenté par une prise. L'application a été installée sur un téléphone, relié au même réseau WiFi que le distributeur. Cette configuration correspond à l'usage prévu au domicile du patient.

Pour observer le comportement du distributeur sans dépendre uniquement de l'application, on a également utilisé les points d'accès de l'interface de communication. Ils permettent d'interroger l'état du distributeur, de déclencher une rotation ou de consulter un diagnostic. Cette possibilité a facilité l'observation des résultats et la reproduction des essais.

### 4.2.2 Catégories de tests

Les tests ont été classés en cinq catégories. La première regroupe les tests du système matériel pris isolément. La deuxième regroupe les tests de l'application. La troisième porte sur la connexion entre l'application et le distributeur. La quatrième est le test de bout en bout, qui suit le scénario complet d'une dose. La cinquième concerne les performances et les limites. Cette organisation permet de localiser précisément l'origine d'un éventuel problème, car un test de bout en bout qui échoue peut alors être rapproché du test élémentaire correspondant.

Un critère d'acceptation a été fixé pour chaque test avant sa réalisation. Un test est considéré comme réussi lorsque le résultat constaté correspond au résultat attendu, et lorsque ce comportement se reproduit à l'identique lors d'essais successifs. Cette exigence de répétabilité, plus stricte qu'un simple succès ponctuel, traduit le niveau de confiance attendu d'un dispositif de santé, pour lequel un fonctionnement occasionnel ne serait pas acceptable.

## 4.3 Tests du système matériel

### 4.3.1 Démarrage et connexion au réseau

Le premier test vérifie que le distributeur démarre correctement et rejoint le réseau WiFi. À la mise sous tension, le distributeur exécute son programme, recherche les réseaux qu'il connaît et se connecte au premier disponible. Le test consiste à mettre l'appareil sous tension, à attendre quelques secondes, puis à confirmer qu'il est joignable sur le réseau.

Ce test a permis de mettre en évidence, puis de corriger, une difficulté liée au démarrage du microcontrôleur, déjà évoquée au chapitre précédent. Une fois cette difficulté résolue, le démarrage est devenu fiable et reproductible. Le distributeur rejoint désormais le réseau de manière constante après chaque mise sous tension.

### 4.3.2 Rotation et précision de la distribution

Le deuxième test, le plus important sur le plan clinique, vérifie que le carrousel avance d'exactement un compartiment à chaque commande. On déclenche une rotation, puis on observe la position du carrousel. Le résultat attendu est qu'un seul compartiment se présente face à l'ouverture, sans débordement sur le compartiment suivant ni arrêt prématuré sur le précédent.

Ce test a servi de support à la calibration de la rotation. En s'appuyant sur le nombre de logements du carrousel et sur le rapport du réducteur, on a déterminé que le déplacement d'un compartiment correspond à une demi-rotation du moteur. Le programme a été réglé en conséquence, puis le test a été répété afin de confirmer la régularité du positionnement. La rotation d'un compartiment dure environ quatre secondes, ce qui reste largement acceptable pour l'usage visé, où la rapidité n'est pas un critère essentiel.

### 4.3.3 Bouton de confirmation

Le troisième test vérifie que le bouton de confirmation est correctement pris en compte. Après une distribution, le patient est censé appuyer sur le bouton pour signaler qu'il a pris sa dose. Le test consiste à appuyer sur le bouton et à vérifier que le distributeur enregistre bien un événement de confirmation.

Ce test a lui aussi révélé une difficulté de câblage du bouton, qui empêchait le démarrage du distributeur dans certaines conditions. Après correction du câblage, le bouton a fonctionné de manière fiable. Chaque pression est désormais détectée et donne lieu à un événement de confirmation, qui sera ensuite exploité par l'application.

### 4.3.4 Diagnostic des composants

Le quatrième test utilise le point d'accès de diagnostic du distributeur. Celui-ci renvoie un état de santé technique, indiquant notamment la présence des composants connectés et la qualité de la connexion au réseau. Ce test permet de confirmer rapidement, et à distance, que le matériel répond correctement, sans avoir à ouvrir le dispositif. Il a confirmé que le distributeur détectait bien ses composants et qu'il communiquait normalement sur le réseau.

### 4.3.5 Bascule entre réseaux WiFi

Le cinquième test matériel vérifie le comportement du distributeur face à un changement de réseau. Le distributeur connaît une liste de réseaux, et doit se connecter automatiquement à celui qui est disponible. Le test consiste à mettre l'appareil sous tension dans un environnement où un réseau connu est présent, puis à confirmer qu'il s'y connecte sans intervention. On vérifie ensuite que le distributeur continue d'essayer de se connecter si aucun réseau connu n'est présent, au lieu de rester bloqué.

Ce test a confirmé que le distributeur rejoint de lui-même un réseau connu, et qu'il poursuit ses tentatives en cas d'absence de réseau. Ce comportement libère l'utilisateur de toute reconfiguration lors d'un déplacement ou d'un changement de réseau, ce qui représente un gain de simplicité notable pour un public peu familier de la technique.

### 4.3.6 Stabilité de l'alimentation

Ce test vérifie que le distributeur reste stable au moment où le moteur démarre. Le démarrage du moteur provoque un appel de courant qui peut, si l'alimentation est insuffisante, faire redémarrer le microcontrôleur. Le test consiste à déclencher plusieurs rotations successives, puis à vérifier que le distributeur ne redémarre pas et qu'il reste joignable sur le réseau tout au long de l'opération.

Ce test a mis en évidence l'importance d'une alimentation correctement dimensionnée. Avec une source trop juste, le démarrage du moteur pouvait perturber le fonctionnement. En prévoyant une alimentation suffisante, reliée à la même masse que le microcontrôleur, le distributeur est resté stable pendant les rotations. Ce point, sans incidence sur le principe de fonctionnement, s'est révélé déterminant pour la fiabilité au quotidien et illustre bien la différence entre un montage qui fonctionne sur l'établi et un dispositif qui fonctionne durablement.

## 4.4 Tests de l'application

### 4.4.1 Persistance des réglages

Ce test vérifie que les réglages saisis par l'utilisateur sont conservés. On définit un horaire et un nom de médicament dans l'écran de réglages, on ferme l'application, puis on la rouvre. Le résultat attendu est que l'horaire et le nom soient toujours présents. Le test a confirmé que les réglages sont conservés dans la base de données locale du téléphone et restitués au démarrage suivant, ce qui évite à l'utilisateur de devoir tout ressaisir.

### 4.4.2 Journal des prises et historique

Ce test vérifie que les prises sont correctement enregistrées et retrouvées dans l'historique. On enregistre une dose comme prise, puis on consulte l'écran d'historique. Le résultat attendu est que la prise apparaisse à la bonne date, avec le bon statut et la bonne couleur. Le test a confirmé que le journal des prises est cohérent, qu'il respecte la règle d'une seule entrée du matin et d'une seule entrée du soir par jour, et que l'historique reflète fidèlement les enregistrements.

### 4.4.3 Notifications

Ce test vérifie que les rappels sont bien programmés. Après l'enregistrement d'un horaire, l'application doit programmer quatre rappels quotidiens, deux à l'heure des doses et deux en relance. Le test a confirmé que les notifications locales sont planifiées correctement et qu'elles s'affichent sur le téléphone sans nécessiter de connexion à Internet.

### 4.4.4 Accessibilité

Ce test vérifie le bon comportement des fonctions d'accessibilité, en particulier le mode de confort visuel. On active ce mode, puis on parcourt les différents écrans. Le résultat attendu est que l'ensemble du texte soit agrandi et reste lisible, sans dégrader la mise en page. Le test a confirmé que le texte s'agrandit sur tous les écrans et que la préférence est conservée d'une utilisation à l'autre.

### 4.4.5 Affichage de la prochaine dose

Ce test vérifie que le tableau de bord met correctement en avant la prochaine dose à venir. On règle un horaire, puis on observe l'écran d'accueil. Le résultat attendu est l'affichage clair de la prochaine échéance, accompagnée d'un compte à rebours, ainsi que des doses du jour avec leur statut. Le test a confirmé que la prochaine dose est calculée et présentée de façon lisible, et que le compte à rebours évolue au fil du temps. Cet affichage est essentiel, car c'est l'information la plus consultée par le patient et par son entourage, et celle qui guide directement l'action à venir.

## 4.5 Connexion au distributeur

La connexion entre l'application et le distributeur constitue le point de jonction des deux moitiés du système. Ce test vérifie qu'un utilisateur peut établir cette connexion simplement, et qu'il dispose d'un retour clair sur son état. Dans l'écran Appareil, l'utilisateur saisit l'adresse du distributeur sur le réseau, puis lance la connexion. L'application interroge alors le distributeur, synchronise l'heure et affiche l'état de la connexion. La figure suivante montre cet écran.

![Figure 4.1 : l'écran de connexion au distributeur, avec la saisie de l'adresse et l'état de la connexion.](C:/xampp/htdocs/DisrtuCare/mockups/out/ConnectingToAppareil.png){width=7cm}

Le test a confirmé que la connexion s'établit lorsque l'adresse est correcte et que le distributeur est sous tension sur le même réseau. L'application indique alors un état connecté, met l'heure du distributeur à jour, et commence à l'interroger régulièrement. L'écran propose également des commandes de vérification, qui permettent de tester le distributeur depuis l'application. Cet écran joue donc un double rôle, de mise en relation et de diagnostic, ce qui en fait un outil précieux lors de l'installation du dispositif.

Au cours des essais, la connexion s'est révélée tributaire de la disponibilité du réseau et de l'exactitude de l'adresse saisie. La mise en place d'une liste de réseaux connus dans le distributeur, ainsi que l'affichage de son état, ont largement simplifié cette étape, qui était initialement la plus délicate de la mise en service.

## 4.6 Test de bout en bout

Le test de bout en bout suit le scénario complet d'une dose, en mobilisant simultanément le matériel et le logiciel. Il constitue la validation la plus représentative de l'usage réel, car il vérifie non pas un organe isolé, mais la chaîne entière.

Le scénario se déroule ainsi. On règle d'abord un horaire dans l'application, qui le transmet au distributeur. À l'heure prévue, le distributeur fait avancer le carrousel d'un compartiment et crée un événement de distribution. Le téléphone affiche son rappel et, en interrogeant le distributeur, prend connaissance de l'événement. Le patient prend alors sa dose et appuie sur le bouton. Le distributeur crée un événement de confirmation, que l'application capte pour enregistrer automatiquement la dose comme prise. L'observance se recalcule enfin.

Ce test a confirmé que la chaîne complète fonctionne comme prévu. Le point le plus remarquable est l'enregistrement automatique de la prise après l'appui sur le bouton. Le patient n'a aucune saisie à effectuer, et pourtant son suivi se met à jour. Ce comportement répond directement à l'objectif du projet, qui est de rendre le suivi d'observance simple et fiable pour des personnes pour qui la manipulation d'un écran peut être un obstacle.

Un second scénario a été éprouvé, celui où le patient ne confirme pas immédiatement la prise. Dans ce cas, le distributeur reste en attente de confirmation, et l'application déclenche une relance par notification après un délai. Le test a confirmé que la relance est bien émise, et que la prise peut être confirmée plus tard, soit par le bouton du distributeur, soit directement dans l'application. Ce double moyen de confirmation est important, car il s'adapte aux situations où le patient s'éloigne du distributeur avant de valider sa prise.

### 4.6.1 Essais répétés et reproductibilité

Pour un dispositif de santé, la conformité d'un essai isolé ne suffit pas. Il faut que le comportement soit reproductible, c'est-à-dire identique d'une fois sur l'autre. Les tests les plus sensibles, en particulier la rotation d'un compartiment, le démarrage et la confirmation par le bouton, ont donc été répétés plusieurs fois de suite. À chaque répétition, le résultat constaté a été comparé au résultat attendu.

Ces répétitions ont confirmé la régularité du dispositif après correction des difficultés initiales. La rotation amène toujours un seul compartiment face à l'ouverture, le démarrage aboutit systématiquement à une connexion au réseau, et chaque pression sur le bouton est détectée. Cette régularité est, pour un dispositif d'aide à la prise de médicaments, un résultat au moins aussi important que la conformité elle-même, car elle conditionne la confiance que le patient pourra accorder à l'appareil.

## 4.7 Résultats

Les résultats des principaux tests sont rassemblés dans le tableau ci-dessous. Pour chaque test, le tableau rappelle l'objectif, le résultat attendu et le résultat constaté.

| Test | Résultat attendu | Résultat constaté |
|---|---|---|
| Démarrage et connexion | Le distributeur rejoint le réseau après allumage | Conforme, après correction du démarrage |
| Rotation d'un compartiment | Un seul compartiment se présente face à l'ouverture | Conforme, après calibration |
| Bouton de confirmation | Chaque pression crée un événement de confirmation | Conforme, après correction du câblage |
| Diagnostic des composants | Le distributeur signale son état et ses composants | Conforme |
| Persistance des réglages | Les réglages sont conservés après fermeture | Conforme |
| Journal et historique | Les prises apparaissent à la bonne date et au bon statut | Conforme |
| Notifications | Quatre rappels quotidiens sont programmés | Conforme |
| Confort visuel | Le texte s'agrandit sur tous les écrans | Conforme |
| Connexion au distributeur | La connexion s'établit et l'état s'affiche | Conforme |
| Bascule entre réseaux | Le distributeur rejoint un réseau connu disponible | Conforme |
| Relance après non-confirmation | Une notification de relance est émise | Conforme |
| Scénario de bout en bout | La prise est enregistrée automatiquement après l'appui | Conforme |

L'examen de ce tableau montre que toutes les fonctions essentielles ont été validées. Plusieurs tests ont d'abord révélé des difficultés, principalement matérielles, qui ont été corrigées au cours du projet. Une fois ces corrections apportées, les comportements observés sont devenus conformes aux attentes et reproductibles, ce qui constitue le critère le plus important pour un dispositif de santé.

## 4.8 Analyse des performances

Au-delà du simple constat de conformité, il est utile d'interpréter le comportement du système. La distribution d'un compartiment dure environ quatre secondes. Cette durée, qui peut sembler longue pour un appareil électronique, est en réalité sans conséquence pour l'usage visé, où la dose est délivrée à un moment programmé et non à la demande immédiate. La lenteur volontaire du moteur favorise au contraire la précision et la douceur du mouvement.

La remontée des événements vers l'application repose sur un sondage effectué toutes les trois secondes. Une distribution ou une confirmation est donc visible dans l'application en quelques secondes au plus. Ce délai est imperceptible dans le contexte d'une prise de médicament, et il permet de garder un mécanisme de communication simple et fiable, bien adapté à un petit microcontrôleur.

La connexion au réseau, une fois la liste de réseaux configurée, s'établit en quelques secondes après la mise sous tension. L'application, de son côté, fonctionne instantanément pour toutes les actions qui ne dépendent pas du matériel, comme la consultation de l'historique ou la modification d'un réglage, puisque ces données sont stockées localement.

Sur le plan de la fiabilité, le point fort du dispositif est son autonomie. Le distributeur assure sa fonction même en l'absence du téléphone, et l'application conserve toutes ses données même hors connexion. Cette double autonomie limite fortement les situations où le patient se retrouverait sans protection.

Il est instructif de rapporter ces performances aux besoins réels du dispositif. Une prise de médicament se fait à des moments espacés de plusieurs heures, et non en continu. Les durées mises en jeu, de l'ordre de quelques secondes pour une rotation ou pour la remontée d'un événement, sont donc sans commune mesure avec l'échelle de temps de l'usage. Autrement dit, le système est largement assez rapide pour ce qu'on lui demande, et la marge est telle qu'une éventuelle variation de quelques secondes resterait imperceptible pour le patient.

Cette adéquation entre les performances et les besoins est un résultat en soi. Elle a permis de privilégier, lors de la conception, la simplicité et la fiabilité plutôt que la rapidité. Un moteur volontairement lent et régulier, un sondage périodique facile à maîtriser, une base de données locale qui répond instantanément : chacun de ces choix s'est révélé bien dimensionné lors des essais, sans surcoût ni complexité inutile.

## 4.9 Limites du système

L'analyse honnête des résultats conduit à reconnaître plusieurs limites, qui n'empêchent pas le dispositif de remplir sa fonction mais qui dessinent les pistes d'amélioration.

La première limite concerne la gestion du temps. Le distributeur s'appuie sur une horloge logicielle, qui se réinitialise après une coupure de courant et doit être resynchronisée par l'application. Tant qu'elle ne l'est pas, la distribution est suspendue par sécurité. L'ajout d'une horloge matérielle, conservant l'heure sur une pile, permettrait au distributeur de fonctionner durablement de façon totalement indépendante.

La deuxième limite concerne l'affichage. L'écran utilisé ne permet pas de retourner le texte, ce qui impose de le monter dans le bon sens dès la conception du boîtier. Cette contrainte est purement mécanique mais doit être anticipée.

La troisième limite concerne la mémoire des événements. Le distributeur ne conserve qu'un événement entre deux interrogations de l'application. Si deux événements survenaient en moins de trois secondes, le premier pourrait être perdu. Dans l'usage réel, où les doses sont espacées de plusieurs heures, ce risque est négligeable, mais il mériterait d'être levé dans une version plus aboutie.

La quatrième limite concerne la communication. Les échanges entre le téléphone et le distributeur ne sont pas chiffrés et ne comportent pas d'authentification. Sur le réseau local du domicile, une personne déjà connectée pourrait en théorie commander le distributeur. Ce niveau de sécurité est acceptable pour un prototype, mais devrait être renforcé pour une version destinée à un usage élargi.

La cinquième limite concerne la capacité. Le carrousel comporte quinze compartiments, ce qui borne l'autonomie du dispositif avant un réapprovisionnement. Cette capacité conviendra à de nombreuses situations, mais pourrait être augmentée selon les besoins du patient.

Ces limites sont énoncées sans détour, car elles font partie d'une démarche d'ingénierie honnête. Aucune ne remet en cause les fonctions essentielles validées plus haut, et chacune ouvre une perspective d'amélioration concrète.

À ces limites répondent en effet des perspectives claires. L'ajout d'une horloge de sauvegarde rendrait le distributeur totalement indépendant du téléphone pour la mesure du temps. Un mécanisme de confirmation des échanges supprimerait le risque de perte d'un événement rapproché. Une protection des communications renforcerait la sécurité pour un usage élargi. Un carrousel de plus grande capacité allongerait l'autonomie entre deux réapprovisionnements. Ces évolutions s'inscrivent toutes dans le prolongement de l'architecture actuelle, ce qui montre que le dispositif a été conçu pour pouvoir grandir sans être refondu.

## 4.10 Synthèse de la validation

La démarche de validation, prise dans son ensemble, dresse un bilan positif. Les organes matériels, une fois leurs difficultés corrigées, se comportent de façon régulière et reproductible. L'application remplit ses fonctions de réglage, de suivi des prises, de rappel et d'accessibilité. La connexion entre les deux moitiés s'établit simplement et offre à l'utilisateur un retour clair sur son état. Enfin, le scénario complet d'une dose se déroule sans accroc, jusqu'à l'enregistrement automatique de la prise après le simple appui sur un bouton.

Cette synthèse ne masque pas les limites identifiées, mais elle confirme que les fonctions essentielles du dispositif sont au rendez-vous. Au terme de cette validation, DisrtuCare se présente comme un prototype fonctionnel et fiable pour l'usage visé, sur lequel des améliorations ciblées pourront être greffées sans remettre en cause l'architecture d'ensemble. C'est précisément ce que l'on attend d'un travail de prototypage en ingénierie biomédicale : un dispositif qui remplit sa mission première de façon sûre, et qui ouvre la voie à une version plus aboutie.

## Conclusion du chapitre

Ce chapitre a soumis le dispositif DisrtuCare à une démarche de tests organisée, depuis les organes pris isolément jusqu'au scénario complet d'une dose. Les résultats montrent que toutes les fonctions essentielles sont validées et reproductibles, après correction des difficultés rencontrées au cours du projet. L'analyse des performances confirme que le comportement du système est bien adapté à son usage, où la régularité et la fiabilité priment sur la rapidité. Les limites identifiées, qu'il s'agisse de l'horloge, de l'affichage, de la mémoire des événements, de la sécurité des échanges ou de la capacité du carrousel, tracent des pistes d'amélioration claires. Le dispositif remplit ainsi sa fonction première, qui est d'aider le patient à prendre ses médicaments à l'heure et d'en assurer le suivi, tout en laissant une marge d'évolution vers une version plus aboutie.
