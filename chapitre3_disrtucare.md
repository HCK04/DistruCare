# Chapitre 3 : Fonctionnement du système et développement logiciel

Ce chapitre s'intéresse au système DisrtuCare tel qu'il fonctionne réellement, une fois assemblé et mis en service. Le chapitre précédent décrivait les choix de conception au niveau théorique. Nous nous plaçons désormais du côté de l'usage concret. Il s'agit de comprendre comment une dose est libérée à l'heure prévue, comment l'application mobile qui accompagne le distributeur a été construite, et surtout comment ces deux univers, le matériel et le logiciel, se coordonnent pour former une chaîne continue, depuis le réglage d'un horaire par le patient jusqu'à l'enregistrement automatique de la prise.

Le propos est tenu volontairement accessible. DisrtuCare est avant tout un dispositif d'aide à l'observance médicamenteuse destiné en priorité à des personnes âgées. Son intérêt se mesure en confort et en sécurité pour le patient, et non en sophistication technique. Les notions informatiques et électroniques ne sont donc détaillées que lorsqu'elles éclairent véritablement le fonctionnement du dispositif. Deux éléments font exception et sont présentés un peu plus précisément, car ils structurent tout le dialogue entre les deux moitiés du système : les points d'accès de l'interface de communication, que l'on appelle l'API, et la base de données locale dans laquelle l'application conserve les informations du patient.

Ce chapitre constitue le cœur technique du rapport. Il est organisé en sept parties. La première présente l'architecture générale en deux moitiés. La deuxième décrit le fonctionnement du système matériel. La troisième détaille le développement de l'application. La quatrième explique l'intégration entre le matériel et le logiciel, qui forme le véritable pipeline du projet. La cinquième propose un organigramme du cycle complet d'une dose. La sixième rend compte des essais d'intégration menés pour valider que les deux moitiés fonctionnent ensemble. La septième revient enfin sur les difficultés rencontrées et les solutions qui ont été apportées.

## 3.1 Une architecture en deux moitiés complémentaires

DisrtuCare n'est pas un objet unique mais l'association de deux ensembles qui coopèrent. D'un côté se trouve un distributeur autonome, bâti autour d'un petit calculateur, dont la mission est vitale : délivrer la bonne dose au bon moment, même en l'absence de téléphone à proximité. De l'autre côté se trouve une application mobile compagnon, qui sert de tableau de bord, de carnet de suivi et de télécommande. Elle enrichit l'expérience du patient et de son entourage, sans pour autant être indispensable au fonctionnement de base.

Les deux moitiés échangent par le réseau WiFi du domicile. Ce découplage est un choix de conception important, car il protège le patient en toutes circonstances. Si le téléphone est éteint, déchargé ou hors de portée, le distributeur continue de connaître l'heure, de délivrer les doses programmées et d'attendre la confirmation du patient. Lorsque l'application est présente, elle apporte la mémoire du suivi, les rappels et une vision claire de l'observance dans le temps. Cette séparation des rôles est résumée dans le tableau suivant.

| Moitié du système | Rôle principal | Indispensable au fonctionnement de base |
|---|---|---|
| Distributeur (matériel) | Mesurer le temps, libérer la dose, recueillir la confirmation du patient | Oui |
| Application (logiciel) | Régler les horaires, rappeler, enregistrer les prises, visualiser l'observance | Non, elle complète le distributeur |

Cette dualité guide tout le reste du chapitre. Le distributeur peut être vu comme l'organe d'action, qui agit sur le monde physique en libérant une dose, tandis que l'application est l'organe de mémoire et de dialogue, qui conserve l'historique et communique avec l'utilisateur. Nous décrivons d'abord chaque moitié séparément, puis nous montrons comment elles se rejoignent pour former un système unique et cohérent. Cette logique reflète aussi la réalité de la réalisation, au cours de laquelle les deux moitiés ont d'abord été développées et vérifiées chacune de leur côté, avant d'être raccordées.

## 3.2 Le fonctionnement du système matériel

### 3.2.1 Le microcontrôleur, chef d'orchestre

Au cœur du distributeur se trouve un microcontrôleur de type NodeMCU. Il s'agit d'un très petit ordinateur, capable d'exécuter sans relâche un programme et d'intégrer nativement la connexion sans fil. C'est lui qui coordonne l'ensemble du dispositif. Il consulte l'heure, commande le moteur, surveille le bouton de confirmation et répond aux sollicitations du téléphone. On peut le comparer au chef d'orchestre du dispositif, qui donne à chaque organe le bon signal au bon instant.

Ce composant a été préféré à une carte plus classique pour une raison simple et décisive : il intègre la connexion WiFi sans aucun module supplémentaire. Cette caractéristique a permis de faire communiquer le distributeur et le téléphone sans recourir à une technologie plus lourde, et d'obtenir un dispositif compact, à faible coût, et facile à alimenter sur une simple prise. Le programme qu'il exécute, appelé micrologiciel, a été conçu pour être à la fois économe et robuste, de manière à fonctionner pendant de longues périodes sans intervention. Le microcontrôleur dialogue avec ses organes par l'intermédiaire de ses broches, qui sont les points de connexion où l'on branche les fils des composants. Le choix de ces broches, qui peut sembler un détail, s'est en réalité révélé déterminant pour la fiabilité du démarrage, comme on le verra dans la dernière partie de ce chapitre.

### 3.2.2 La distribution d'une dose : une rotation maîtrisée

La libération d'une dose repose entièrement sur la rotation précise d'un carrousel percé de plusieurs logements. Chaque logement contient la prise correspondant à un moment de la journée. Pour faire avancer ce carrousel d'un cran, c'est-à-dire exactement un logement, ni plus, ni moins, le dispositif utilise un moteur dit pas à pas. Contrairement à un moteur ordinaire qui tourne librement, ce type de moteur progresse par petits incréments que l'on peut commander et compter un par un. C'est cette propriété qui garantit la précision attendue d'un dispositif destiné à la santé.

Le moteur est piloté par l'intermédiaire d'un petit circuit de commande, qui adapte les signaux du microcontrôleur, trop faibles pour entraîner directement le moteur, en signaux capables d'alimenter ses bobines. Le microcontrôleur envoie une séquence ordonnée d'impulsions sur les bobines, et c'est l'enchaînement régulier de ces impulsions qui fait tourner l'axe d'un incrément à chaque étape. En comptant le nombre d'impulsions envoyées, le programme sait exactement de combien le carrousel a tourné.

Dans DisrtuCare, le carrousel comporte quinze compartiments. Il est entraîné par l'intermédiaire d'un réducteur, c'est-à-dire un jeu d'engrenages qui ralentit le mouvement et démultiplie la force. Compte tenu du nombre de logements et du rapport de ce réducteur, le moteur doit effectuer exactement une demi-rotation pour amener le compartiment suivant face à l'ouverture. Le programme compte le nombre d'incréments correspondant à cette demi-rotation, puis arrête le moteur pile au bon endroit. Dès la rotation terminée, l'alimentation des bobines est coupée afin d'éviter un échauffement inutile lorsque le moteur est à l'arrêt, et afin de ne pas consommer de courant sans raison.

L'enjeu de cette mécanique est essentiellement clinique. Il faut délivrer une seule dose, complète et bien identifiable. Le comptage des incréments, associé aux cloisons physiques qui séparent les compartiments, assure que la bonne case se présente face à l'ouverture à chaque déclenchement. Cette double sécurité, à la fois logicielle par le comptage et mécanique par les cloisons, est au centre de la fiabilité du distributeur. Une rotation trop courte laisserait la dose coincée entre deux compartiments, tandis qu'une rotation trop longue risquerait de libérer deux doses à la fois. C'est pourquoi la justesse de ce mouvement a fait l'objet d'un réglage soigneux, décrit plus loin.

### 3.2.3 Savoir quand distribuer : la gestion du temps

Pour distribuer une dose à huit heures du matin, le système doit connaître l'heure. Dans la version finale du dispositif, cette fonction est assurée par une horloge logicielle. Le distributeur ne dispose pas d'une horloge matérielle indépendante. Il reçoit l'heure exacte du téléphone au moment de la connexion, puis la maintient lui-même tout au long de son fonctionnement, en comptant le temps écoulé depuis cette mise à l'heure.

Une sécurité importante a été intégrée à ce mécanisme. Tant que l'heure n'est pas connue de façon fiable, toute distribution est interdite. On évite ainsi qu'une dose ne soit délivrée par erreur à minuit, qui est la valeur par défaut d'un appareil que l'on vient d'allumer. Cette précaution traduit une exigence de prudence propre aux dispositifs de santé : en cas de doute sur l'heure, le système préfère ne rien faire plutôt que d'agir au mauvais moment. La contrepartie de ce choix est que le distributeur doit être mis à l'heure par l'application après chaque coupure de courant. Cette mise à l'heure étant automatique dès que le téléphone se connecte, elle ne représente pas une contrainte pour l'utilisateur, mais elle constitue une limite que le chapitre de validation reprendra.

### 3.2.4 La confirmation du patient : le bouton

Lorsqu'une dose vient d'être délivrée, le système attend que le patient confirme l'avoir prise. Cette confirmation se fait par un simple bouton poussoir. Une seule pression suffit. Ce geste, anodin pour l'utilisateur, joue un rôle déterminant dans la chaîne de traçabilité décrite plus loin, puisqu'il déclenche l'enregistrement automatique de la prise dans le carnet de suivi.

Le choix d'un bouton physique répond directement au public visé. Pour une personne âgée, appuyer sur un bouton bien visible est souvent plus naturel et plus rassurant que de manipuler un écran tactile. Le geste de confirmation reste donc simple et tangible, tout en alimentant un suivi numérique riche. Le programme prend soin de ne tenir compte de l'appui que lorsqu'une confirmation est réellement attendue, c'est-à-dire après une distribution. Il intègre par ailleurs une courte temporisation, appelée anti-rebond, qui évite qu'une seule pression ne soit comptée plusieurs fois en raison des micro-vibrations du contact.

### 3.2.5 Une boucle de fonctionnement autonome

Une fois allumé, le distributeur exécute en permanence une boucle qui enchaîne, plusieurs fois par seconde et sans jamais se bloquer, quatre vérifications successives. Il répond d'abord aux éventuelles demandes du téléphone. Il compare ensuite l'heure courante aux horaires programmés. Il surveille le bouton de confirmation. Il entretient enfin la connexion WiFi et la rétablit si elle vient à tomber.

C'est ce fonctionnement autonome qui fait la robustesse du dispositif. La fonction vitale, qui consiste à distribuer à l'heure et à recueillir la confirmation du patient, ne dépend jamais de la présence du téléphone. Le caractère non bloquant de la boucle est tout aussi important. Aucune tâche ne fige le système en attendant un événement. Par exemple, le distributeur ne reste pas immobilisé à attendre une commande du téléphone, il continue de vérifier l'heure et de surveiller le bouton en parallèle. De cette manière, le distributeur reste toujours réactif, prêt à répondre au téléphone comme à l'horloge, quelle que soit la situation. Cette conception en boucle continue, simple dans son principe, est en réalité la garantie d'un comportement régulier et prévisible.

### 3.2.6 Une mémoire qui résiste aux coupures

Les horaires du matin et du soir, ainsi que le nom du médicament, sont conservés dans une mémoire non volatile. Concrètement, ces réglages survivent à une coupure de courant. Après un redémarrage, le distributeur retrouve son horaire sans avoir besoin du téléphone. Cette persistance contribue à l'autonomie du dispositif et évite de devoir tout reconfigurer après une simple coupure de secteur. Un repère interne permet au programme de savoir si la mémoire a déjà été initialisée, afin de ne pas interpréter des valeurs vides comme un horaire valide lors de la toute première mise en service.

## 3.3 Le développement logiciel : l'application compagnon

### 3.3.1 La technologie retenue

L'application a été développée avec la technologie Expo et React Native. Celle-ci permet d'écrire le code une seule fois et de le faire fonctionner aussi bien sur Android que sur iOS. Ce choix évite de maintenir deux applications distinctes et accélère nettement la réalisation, tout en garantissant une expérience homogène quel que soit le téléphone du patient ou de l'aidant. Le langage utilisé est le TypeScript, qui aide à écrire un code clair et structuré, plus facile à faire évoluer par la suite. Ce socle technique, répandu et bien outillé, présente aussi l'avantage de pouvoir être repris et amélioré ultérieurement, ce qui est précieux pour un prototype destiné à évoluer.

### 3.3.2 Une organisation en quatre écrans

L'interface est structurée en quatre onglets, pensés pour une utilisation simple et directe. Le tableau de bord présente l'essentiel d'un coup d'œil. L'historique offre le journal des prises. L'écran Appareil permet de se connecter au distributeur. L'écran Réglages réunit les paramètres. Le tableau ci-dessous résume le rôle de chaque écran.

| Écran | Fonction principale |
|---|---|
| Tableau de bord | Prochaine dose, observance des trente derniers jours, doses du jour |
| Historique | Journal des prises, jour par jour, avec un code couleur |
| Appareil | Connexion au distributeur et commandes de vérification |
| Réglages | Heures du matin et du soir, nom du médicament, rappels, confort visuel |

Le tableau de bord est l'écran le plus consulté, car il rassemble l'information utile au quotidien. En haut de l'écran figure une carte mettant en avant la prochaine dose à venir, accompagnée d'un compte à rebours qui indique le temps restant avant l'échéance, ainsi que le nom du médicament suivi. Cette information est volontairement la plus visible, car c'est elle qui guide l'action immédiate du patient. En faisant défiler l'écran vers le bas, l'utilisateur découvre un indicateur d'observance présenté sous la forme d'un anneau, qui résume le respect du traitement sur les trente derniers jours, puis un décompte distinguant les prises effectuées, les prises en retard et les oublis. Apparaissent ensuite les cartes des doses du jour, une pour le matin et une pour le soir, chacune affichant son horaire et son statut au moyen d'un code couleur. Lorsque toutes les doses du jour ont été traitées, un message de félicitations vient confirmer au patient qu'il n'a plus rien à faire pour la journée. L'ensemble de cet écran a été conçu pour être lisible sans effort, avec de grandes valeurs mises en avant et un vocabulaire simple.

### 3.3.3 La base de données locale (SQLite)

Toutes les informations sont conservées dans le téléphone, au sein d'une petite base de données appelée SQLite. Ce choix garantit un fonctionnement entièrement hors-ligne. Aucune connexion à Internet ni à un serveur externe n'est nécessaire, ce qui est appréciable à la fois pour la confidentialité des données de santé et pour la fiabilité au quotidien. Les informations du patient restent sur son propre appareil et ne transitent par aucun service extérieur.

La base se compose de deux tables. La première est une table de réglages qui ne contient qu'une seule ligne. On y trouve le nom du médicament, l'heure du matin, l'heure du soir, l'état des rappels et l'adresse du distributeur sur le réseau. La seconde est une table de journal des prises. Elle enregistre une entrée par dose, avec la date, le moment de la journée et le statut, qui peut être une prise, un retard ou un oubli. Une règle interne garantit une seule entrée du matin et une seule entrée du soir par jour, ce qui rend l'historique cohérent et facile à interpréter, et évite par exemple qu'une même dose soit comptée deux fois. C'est sur cette base que s'appuient le tableau de bord et le calcul de l'observance, qui n'est rien d'autre qu'une lecture ordonnée de ce journal.

### 3.3.4 Les rappels par notifications locales

À chaque enregistrement d'un horaire, l'application reprogramme automatiquement quatre rappels quotidiens. Le premier survient le matin, le deuxième le soir, et les deux derniers servent de relance trente minutes plus tard si la prise n'a pas encore été confirmée. Ces rappels sont locaux, c'est-à-dire qu'ils s'affichent sur le téléphone même sans connexion à Internet. Ils contribuent directement à l'objectif du projet, qui est de réduire les oublis de prise. Le mécanisme de relance est particulièrement utile, car il prend en compte le cas fréquent où le patient entend le premier rappel mais oublie d'agir dans la foulée. En reprogrammant ces rappels à chaque changement d'horaire, l'application garantit qu'ils restent toujours en accord avec le traitement en cours.

### 3.3.5 L'accessibilité, une exigence de conception

Le public visé étant essentiellement âgé, l'accessibilité a guidé toute la conception de l'interface. Les polices sont grandes, le contraste est marqué, les zones tactiles sont larges, et un code couleur intuitif distingue les statuts, le vert pour une prise, l'orange pour un retard et le rouge pour un oubli. L'écran de réglages illustre bien ces principes. Il aligne verticalement des champs sobres et nettement séparés : le nom du médicament, l'heure de la dose du matin, l'heure de la dose du soir, et l'activation des rappels. Chaque heure se modifie d'une simple touche, et la disposition aérée limite tout risque de confusion.

Une fonction de confort visuel a de plus été ajoutée. D'un seul geste, au moyen d'un interrupteur situé en tête de l'écran de réglages, elle agrandit l'ensemble du texte de l'application. Lorsque ce mode est activé, tous les écrans, sans exception, voient leur texte grossir, ce qui aide les patients dont la vue est fatiguée à lire confortablement les informations. Ce réglage est conservé d'une utilisation à l'autre, de sorte que le patient n'a pas à le réactiver à chaque ouverture de l'application. Cette fonction répond à un besoin concret du public visé, pour qui la taille du texte est souvent un obstacle décisif à l'usage d'une application.

L'écran d'historique complète enfin ce dispositif d'accessibilité en donnant une vision d'ensemble du suivi. Il présente un bandeau de jours, sous la forme d'un petit calendrier de la semaine, ainsi qu'une liste détaillant les prises de chaque journée. Le même code couleur y est repris, de sorte qu'un simple regard suffit à repérer les jours où une dose a été manquée. Cet écran s'adresse autant au patient qu'à son entourage, en offrant une lecture rapide de l'évolution de l'observance dans le temps, sans qu'il soit nécessaire de comprendre le moindre élément technique.

## 3.4 L'intégration matériel et logiciel : le pipeline complet

C'est le point central du projet. Il s'agit de faire dialoguer le distributeur et le téléphone pour qu'un geste physique se traduise en donnée de suivi, et inversement pour qu'un réglage saisi sur l'écran agisse sur le distributeur. Cette intégration est ce qui transforme deux objets indépendants en un système unique.

### 3.4.1 Le canal de communication : un WiFi multi-réseaux

Le distributeur et le téléphone sont reliés au même réseau WiFi. Le distributeur se comporte alors comme un petit serveur, possédant une adresse sur le réseau que l'application utilise pour le joindre. Pour faciliter l'usage au quotidien, le distributeur connaît une liste de réseaux, par exemple le réseau du domicile et un partage de connexion de secours. Il se connecte automatiquement à celui qui est disponible et bascule de l'un à l'autre sans aucune intervention. Cette souplesse évite d'avoir à reprogrammer l'appareil à chaque changement de réseau, ce qui serait inenvisageable pour un utilisateur non technicien. Le distributeur poursuit en outre ses tentatives de connexion tant qu'aucun réseau connu n'est disponible, de manière à rejoindre le réseau de lui-même dès qu'il réapparaît, par exemple après une coupure.

### 3.4.2 Le langage commun : l'interface de communication et ses points d'accès

Les deux appareils échangent de courts messages au format JSON, qui est un format texte simple et lisible. Ils s'appuient pour cela sur le protocole HTTP, le même que celui utilisé par les sites web. Le distributeur expose plusieurs points d'accès, appelés en anglais endpoints. Chacun correspond à une adresse précise et à une action déterminée. On peut se représenter ces points d'accès comme un petit ensemble de boutons que l'application peut actionner à distance. Le tableau ci-dessous présente les principaux points d'accès du système.

| Point d'accès | Nature | Signification |
|---|---|---|
| `/status` | Lecture | Donne l'état du distributeur : heure, horaires et dernier événement |
| `/sync` | Commande | Transmet un nouvel horaire (matin, soir et nom du médicament) |
| `/settime` | Commande | Règle l'horloge du distributeur sur l'heure du téléphone |
| `/motor` | Commande | Fait avancer le carrousel d'un compartiment, pour vérification |
| `/diag` | Lecture | Indique l'état de santé technique du distributeur et de ses composants |

Cette interface volontairement réduite suffit à couvrir l'ensemble des besoins du projet : régler les horaires, déclencher une distribution, vérifier l'état du matériel et s'informer de la situation. Sa simplicité est un atout, car elle rend le dialogue facile à comprendre, à tester et à faire évoluer. Chaque point d'accès ayant un rôle bien défini, on peut le solliciter isolément, ce qui s'est avéré très pratique lors des essais pour vérifier un comportement précis sans mobiliser tout le système.

### 3.4.3 Du distributeur vers l'application : le principe du sondage

Un microcontrôleur ne peut pas facilement appeler le téléphone de sa propre initiative. La solution retenue est simple et robuste. C'est l'application qui interroge le distributeur toutes les trois secondes, selon un mécanisme appelé sondage. Chaque réponse contient un numéro d'événement. Lorsque ce numéro change, l'application comprend qu'un fait nouveau s'est produit, par exemple une dose qui vient d'être délivrée ou une prise qui vient d'être confirmée, et elle réagit en conséquence. Plutôt que le distributeur ne téléphone à l'application, c'est donc l'application qui demande régulièrement s'il y a du nouveau. Cette approche est particulièrement adaptée à un petit microcontrôleur, car elle reste légère et facile à maîtriser. Elle évite de recourir à des techniques de communication plus complexes, qui auraient alourdi le micrologiciel sans bénéfice réel pour un usage où les événements sont espacés de plusieurs heures.

### 3.4.4 Le pipeline de bout en bout

L'ensemble du système peut alors se lire comme une chaîne continue reliant le patient, le distributeur et l'application. Cette chaîne se déroule en cinq étapes.

La première étape est le réglage. Dans l'écran Réglages, l'utilisateur fixe les heures, par exemple huit heures le matin et vingt heures le soir. L'application enregistre cet horaire dans sa base locale, le transmet au distributeur qui le mémorise, puis programme les rappels.

La deuxième étape est la distribution. À l'heure prévue, le distributeur détecte la concordance entre l'heure courante et l'horaire programmé. Le carrousel avance d'un compartiment, la dose tombe dans le plateau, et un événement de distribution est créé.

La troisième étape est la notification. Au même moment, le téléphone affiche son rappel local. En interrogeant le distributeur, l'application constate le nouvel événement et l'inscrit dans son journal.

La quatrième étape est la confirmation. Le patient prend sa dose et appuie sur le bouton du distributeur. Un événement de confirmation est aussitôt créé.

La cinquième étape est la traçabilité. L'application capte cette confirmation et enregistre automatiquement la dose comme prise, sans aucune saisie manuelle. L'indicateur d'observance se recalcule en conséquence.

Le point fort de cette intégration tient en une phrase. Un simple geste physique sur le distributeur met à jour le dossier numérique du patient. Le suivi d'observance se construit de lui-même, ce qui correspond précisément à l'objectif d'un dispositif destiné à des personnes pour qui la saisie sur écran peut représenter un obstacle. C'est dans cette boucle de rétroaction, qui relie un geste concret à une donnée durable, que réside la véritable valeur ajoutée du projet, et c'est elle qui distingue DisrtuCare d'un simple pilulier mécanique.

## 3.5 L'organigramme du cycle d'une dose

Le déroulement complet d'une dose peut se résumer par le logigramme suivant. Les questions y représentent des décisions, et les autres lignes représentent des actions.

```
            Démarrage du distributeur
                      |
                      v
        L'heure correspond-elle à une dose ?
              | non                | oui
              v                    v
          Attendre        Le moteur avance d'un compartiment,
          (boucle)        la dose tombe dans le plateau
              ^                    |
              |                    v
              |        Un événement de distribution est
              |        enregistre dans le distributeur
              |                    |
              |                    v
              |        L'application, qui interroge toutes
              |        les trois secondes, affiche l'événement
              |                    |
              |                    v
              |        Le patient appuie-t-il sur le bouton ?
              |           | non              | oui
              |           v                  v
              |     Rappel renvoyé     Evénement de confirmation,
              |     apres 30 minutes   la dose est enregistree comme prise
              |           |                  |
              +-----------+                  v
                                  Dose terminée,
                          remise à zéro le lendemain
```

En résumé, tant que l'heure ne correspond pas à un horaire, le distributeur tourne dans sa boucle d'attente. Au moment voulu, il agit, en distribuant puis en attendant la confirmation du patient. Si celui-ci n'appuie pas sur le bouton, l'application le relance par une notification. Dès qu'il appuie, la prise est enregistrée automatiquement et le cycle s'achève, prêt à recommencer le lendemain. Ce schéma met en évidence les deux moments où le matériel et le logiciel se rejoignent : lors de la distribution, que l'application observe, et lors de la confirmation, que l'application enregistre.

## 3.6 Le test d'intégration

L'intégration entre le matériel et le logiciel a fait l'objet d'essais spécifiques, menés au fil de la réalisation. Ces essais ne visent pas à mesurer des performances, ce qui relève du chapitre de validation, mais à vérifier que les deux moitiés du système fonctionnent réellement ensemble, étape par étape. Leur intérêt est de permettre de localiser rapidement l'origine d'un problème, en isolant chaque maillon de la chaîne.

Le premier essai a porté sur la connexion entre l'application et le distributeur. Il s'agissait de confirmer que l'application parvenait à joindre le distributeur sur le réseau, à lire son état par le point d'accès de lecture, et à afficher une connexion établie. Cet essai a permis de valider le canal de communication de bout en bout, et il a constitué le préalable indispensable à tous les autres.

Le deuxième essai a porté sur la commande du moteur. En déclenchant la rotation depuis l'application, par le point d'accès dédié, on a vérifié que le distributeur recevait bien la commande, faisait avancer le carrousel, et renvoyait une réponse de bonne exécution. Cet essai a aussi servi à calibrer la rotation, afin que le carrousel avance d'exactement un compartiment.

Le troisième essai a porté sur la remontée des événements. Après une distribution, on a vérifié que le numéro d'événement renvoyé par le distributeur changeait bien, et que l'application réagissait à ce changement. Cet essai a confirmé que le mécanisme de sondage fonctionnait comme prévu, et qu'aucun événement n'était perdu dans les conditions normales d'usage.

Le quatrième essai a porté sur la confirmation par le bouton. En appuyant sur le bouton après une distribution, on a vérifié que le distributeur créait un événement de confirmation, et que l'application enregistrait automatiquement la dose comme prise dans son journal. Cet essai a validé le maillon le plus important de la chaîne de traçabilité, celui qui relie un geste physique à une donnée de suivi.

Le cinquième essai a porté sur la gestion du temps. On a vérifié que le distributeur, une fois connecté à l'application, recevait l'heure exacte du téléphone, et qu'il refusait toute distribution tant que cette heure n'était pas connue. Cet essai a confirmé le bon comportement de l'horloge logicielle et de sa sécurité.

Le sixième essai a utilisé le point d'accès de diagnostic. Celui-ci permet de vérifier à distance l'état de santé technique du distributeur et la présence de ses composants. Il s'est révélé précieux pour confirmer rapidement que le matériel répondait correctement, sans avoir à ouvrir le dispositif.

Ces essais d'intégration, menés progressivement, ont permis de fiabiliser l'assemblage et de préparer la phase de validation proprement dite, qui fait l'objet du chapitre suivant. Leur déroulement progressif, du canal de communication jusqu'au cycle complet d'une dose, a aussi servi de fil conducteur à la mise au point du dispositif.

## 3.7 Difficultés rencontrées et solutions apportées

La réalisation a soulevé plusieurs difficultés concrètes, matérielles comme logicielles. Les principales sont présentées ci-dessous, car elles illustrent bien la nature réelle d'un projet d'intégration, dans lequel la théorie se heurte aux contraintes des composants.

La première difficulté concernait un démarrage parfois empêché par une broche sensible. Le distributeur refusait de démarrer dans certaines conditions. Le moteur était relié à une broche particulière du microcontrôleur, dont l'état au moment précis de la mise sous tension détermine le mode de démarrage. La connexion au moteur faussait ce démarrage et bloquait le programme. La solution a consisté à déplacer ce fil de commande vers une broche neutre, ce qui a rendu le démarrage fiable et reproductible. Cette difficulté, longue à identifier, a montré qu'un détail de câblage pouvait avoir des conséquences importantes sur le comportement d'ensemble.

La deuxième difficulté venait du bouton de confirmation. Branché lui aussi sur une broche sensible au démarrage, il maintenait cette broche dans un état incorrect à l'allumage, à cause d'un câblage inadapté. Le recâblage du bouton sur les bonnes pattes a résolu le problème sans modifier le programme. Ces deux premières difficultés ont mis en évidence l'importance des broches dites de démarrage, et la nécessité de bien choisir celles que l'on utilise pour les organes du dispositif.

La troisième difficulté portait sur la calibration de la rotation. Faire avancer le carrousel d'exactement un compartiment a demandé un réglage soigné. Connaissant le nombre de logements et le rapport du réducteur, le bon déplacement correspond à une demi-rotation du moteur. Le programme a été ajusté en conséquence, puis vérifié visuellement pour s'assurer que chaque case se présentait bien face à l'ouverture. Ce réglage illustre la complémentarité du calcul et de l'observation directe, l'un fixant la valeur théorique et l'autre confirmant le résultat réel.

La quatrième difficulté concernait la connexion au réseau. Pour éviter de devoir reprogrammer l'appareil à chaque changement de réseau, le distributeur a été doté d'une liste de réseaux connus. Il rejoint automatiquement celui qui est disponible et bascule sans intervention si la situation change. Cette amélioration a considérablement simplifié l'usage du dispositif et a supprimé une opération technique qui aurait été hors de portée de l'utilisateur final.

La cinquième difficulté concernait l'affichage. L'écran pouvait, en cas de mauvais contact, bloquer tout le distributeur au démarrage. Le programme a été rendu tolérant. Il vérifie d'abord la présence de l'écran et continue à fonctionner normalement même en son absence. Une limite a toutefois été identifiée. Ce type d'écran ne permet pas de retourner le texte affiché, ce qui impose de monter l'écran dans le bon sens dès la conception du boîtier.

La sixième difficulté concernait l'alimentation. Le démarrage du moteur provoque un appel de courant qui peut faire redémarrer le microcontrôleur lorsque la source d'alimentation est trop juste. La piste retenue consiste à prévoir une alimentation suffisante pour le moteur, reliée à la même masse que le microcontrôleur, afin de garantir un fonctionnement stable. Cette difficulté rappelle qu'un dispositif électronique ne se résume pas à son programme, et que la qualité de son alimentation conditionne directement sa fiabilité.

## Conclusion du chapitre

Ce chapitre a montré que DisrtuCare repose sur une architecture découplée mais coordonnée. Le distributeur autonome assure la fonction vitale, qui est de délivrer la bonne dose à la bonne heure. L'application compagnon enrichit l'expérience par les rappels, le suivi d'observance et la commande à distance. Leur intégration, au moyen d'une communication WiFi simple et d'une interface réduite à quelques points d'accès, permet qu'un geste physique du patient se traduise automatiquement en donnée de suivi.

Les essais d'intégration ont confirmé que les deux moitiés du système fonctionnent réellement ensemble. Les difficultés rencontrées, essentiellement matérielles, ont toutes trouvé une solution, et les limites restantes ont été clairement identifiées en vue d'une version aboutie. Au-delà de ses aspects techniques, ce chapitre aura surtout montré comment des choix simples, guidés par les besoins réels du patient, peuvent se combiner pour former un dispositif cohérent et fiable. Le chapitre suivant s'attache à éprouver ce fonctionnement de manière plus formelle, par une démarche de tests et de validation.
