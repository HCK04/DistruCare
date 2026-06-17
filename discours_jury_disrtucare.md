---
title: "DisrtuCare — Discours de présentation"
subtitle: "Pitch jury · ~5 minutes"
date: "Juin 2026"
lang: fr
documentclass: article
geometry: "margin=2.6cm"
fontsize: 12pt
linestretch: 1.4
mainfont: "Segoe UI"
header-includes:
  - \usepackage{xcolor}
  - \definecolor{dcblue}{HTML}{1F6FEB}
  - \usepackage{parskip}
---

\begin{center}
\Large\textbf{DisrtuCare}\\[2pt]
\normalsize\textit{Le distributeur de médicaments qui veille à la place du patient}
\end{center}

\vspace{0.6em}

**\textcolor{dcblue}{[Accroche]}**

Mesdames et messieurs les membres du jury, bonjour.

Laissez-moi commencer par un chiffre. Une personne âgée sur deux ne prend pas
correctement ses médicaments : une dose oubliée, une dose prise deux fois, un horaire
décalé. Ce n'est pas de la négligence — c'est la vie quotidienne. Mais les conséquences,
elles, sont lourdes : hospitalisations évitables, traitements qui échouent, familles qui
s'inquiètent à distance.

Et aujourd'hui, comment surveille-t-on cela ? Avec un pilulier en plastique et un peu de
mémoire. C'est exactement ce problème que nous avons décidé de résoudre.

**\textcolor{dcblue}{[Le projet]}**

Notre projet s'appelle **DisrtuCare**. C'est un distributeur de médicaments **intelligent
et autonome**, piloté par une application mobile. Son rôle est simple à énoncer :
**distribuer la bonne dose, au bon moment, et vérifier qu'elle a bien été prise.**

Le système repose sur deux éléments qui dialoguent. D'un côté, une **application mobile**
sur le téléphone du patient ou de sa famille. De l'autre, un **boîtier physique** que nous
avons conçu et assemblé, avec un écran, un moteur, un carrousel de quinze compartiments et
un bouton de confirmation.

**\textcolor{dcblue}{[Comment ça marche, en trois temps]}**

Le fonctionnement tient en trois temps très simples.

**Premier temps : on programme.** Dans l'application, on saisit le médicament et les
horaires — par exemple huit heures le matin, vingt heures le soir. L'application enregistre
tout, programme les rappels, puis envoie ces horaires au distributeur **par le réseau WiFi
de la maison**. À partir de là, le boîtier sait quoi faire, et il le retient même en cas de
coupure de courant.

**Deuxième temps : il distribue, tout seul.** À l'heure prévue, le distributeur n'a plus
besoin du téléphone. Il fait tourner son moteur, le carrousel avance d'un compartiment, et
la dose tombe dans le plateau. Au même instant, le patient reçoit une notification sur son
téléphone : « il est temps de prendre votre médicament ». C'est un point clé : **le
distributeur est autonome.** Même sans téléphone à proximité, même sans Internet, il
continue de distribuer.

**Troisième temps : on confirme.** Le patient prend sa dose, et appuie sur le bouton du
boîtier. Ce simple geste remonte jusqu'à l'application, qui enregistre la prise. Et si
personne n'appuie ? L'application le sait aussi : elle marque l'oubli, et peut relancer le
patient, ou alerter un proche.

**\textcolor{dcblue}{[Le cœur invisible : la communication]}**

Derrière cette simplicité, il y a un vrai travail d'ingénierie sur **la communication entre
le logiciel et le matériel**. Le téléphone et le boîtier échangent en permanence, de façon
fiable, sans jamais perdre une information.

Le téléphone interroge le distributeur **toutes les trois secondes** — il lui demande
simplement : « du nouveau ? ». Et dès qu'un événement se produit — une dose distribuée, un
bouton pressé — le distributeur le signale, et l'application réagit en quelques secondes.
Tout cela avec une règle de sécurité que nous tenons à souligner : **tant que l'heure n'est
pas fiable, le distributeur s'interdit toute distribution.** Pas de risque de donner un
médicament au mauvais moment.

**\textcolor{dcblue}{[Ce qui nous distingue]}**

Pourquoi notre solution se démarque ? Pour trois raisons.

D'abord, **l'autonomie** : le boîtier fonctionne seul, sans dépendre d'une connexion
permanente ni d'un serveur dans le cloud.

Ensuite, **la confidentialité** : toutes les données de santé restent **dans le téléphone**,
en local. Rien ne part sur Internet. Pour des données médicales, c'est essentiel.

Enfin, **le suivi réel** : l'application ne se contente pas de rappeler. Elle calcule
**l'observance** — le pourcentage de doses réellement prises. Un médecin, une famille,
peuvent voir d'un coup d'œil si le traitement est suivi.

**\textcolor{dcblue}{[Conclusion]}**

Mesdames et messieurs, DisrtuCare, ce n'est pas un simple pilulier connecté. C'est un
système complet, du logiciel jusqu'au matériel que nous avons assemblé de nos mains, pensé
autour d'une seule idée : **redonner de la tranquillité.** De la tranquillité au patient qui
n'a plus à se souvenir. Et de la tranquillité à ses proches, qui savent, enfin, que le
traitement est suivi.

Le téléphone programme. Le distributeur agit. Et ensemble, ils veillent.

Je vous remercie de votre attention, et je suis prêt à répondre à vos questions.
