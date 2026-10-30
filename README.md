# Skyval Calcul

Skyval Calcul prête la carte graphique de ton PC à Skyval, une petite agence : elle y fait tourner une IA qui trie des mails, quelques secondes à quelques minutes à la fois.

**Il te faut** : Windows 10, Windows 11 ou Ubuntu · une carte graphique NVIDIA avec **au moins 12 Go** de mémoire · Tailscale avec le partage d'Atlas accepté · la clé donnée par l'administrateur de Skyval.

**Temps** : environ 30 minutes la première fois, surtout des téléchargements. Ensuite, tout se lance tout seul.

> ⚠️ **Sans carte NVIDIA d'au moins 12 Go, ce n'est pas la peine d'installer.** Les cartes AMD et Intel, et les cartes NVIDIA plus petites (8 Go, 10 Go…), ne reçoivent aucun calcul : les IA assez fiables pour Skyval sont trop lourdes pour elles.

## Sommaire

1. [Avant de commencer](#1-avant-de-commencer)
2. [Installer sur Windows 10 ou 11](#2-installer-sur-windows-10-ou-11)
3. [Installer sur Ubuntu](#3-installer-sur-ubuntu)
4. [Régler Skyval Calcul](#4-régler-skyval-calcul)
5. [Au quotidien](#5-au-quotidien)
6. [Ça ne marche pas](#6-ça-ne-marche-pas)
7. [Pour l'administrateur de Skyval](#7-pour-ladministrateur-de-skyval)

---

## 1. Avant de commencer

### 1.1 Vérifier ta carte graphique

**Sur Windows** : appuie en même temps sur **Ctrl + Maj + Échap** (le Gestionnaire des tâches s'ouvre). Va dans l'onglet **Performance**, puis clique sur **GPU** (s'il y en a deux, prends celui qui s'appelle NVIDIA).

✅ Tu dois voir un nom qui commence par **NVIDIA** et, en bas, **Mémoire GPU dédiée** de **12,0 Go** ou plus.

**Sur Ubuntu** : la commande `nvidia-smi` (voir l'[étape 3.2](#32-vérifier-le-pilote-nvidia)) affiche ta carte et sa mémoire.

Exemples de cartes qui marchent : RTX 3060 12 Go, RTX 4060 Ti 16 Go, RTX 4070, 4080, 3090, 4090, 5090…

### 1.2 Installer Tailscale

Tailscale est un réseau privé : il relie ton PC à Atlas, le serveur de Skyval.

1. Télécharge Tailscale sur https://tailscale.com/download et installe-le.
2. Ouvre-le et connecte-toi (avec un compte Google, Microsoft ou autre).
3. Ouvre le lien de partage que l'administrateur de Skyval t'a envoyé, et clique sur **Accept** (accepter).

✅ C'est bon quand l'icône Tailscale (près de l'horloge, en bas à droite sur Windows) indique que tu es connecté.

### 1.3 Garder ta clé sous la main

L'administrateur de Skyval te donne **une clé** (une longue suite de lettres et de chiffres). Elle ne sert qu'à **un** PC. Garde-la de côté : tu la colleras à l'[étape 4.2](#42-relier-ton-pc-à-skyval).

Il te faut aussi environ **20 Go libres** sur ton disque.

---

## 2. Installer sur Windows 10 ou 11

Sur Ubuntu ? Passe directement à l'[étape 3](#3-installer-sur-ubuntu).

Trois mots que tu vas croiser :
- **PowerShell** (ou **Terminal**) : la fenêtre où on tape des commandes.
- **WSL** : un petit Linux caché dans Windows, dont Docker a besoin.
- **Docker** : le logiciel qui fait tourner Skyval Calcul.

**Comment copier une commande** : passe la souris sur le bloc gris, clique sur l'icône de copie en haut à droite du bloc. Dans PowerShell, colle avec **clic droit** (ou **Ctrl + V**), puis appuie sur **Entrée**. Une seule commande à la fois.

**Comment ouvrir PowerShell en administrateur** (demandé à certaines étapes) : fais un **clic droit sur le bouton Démarrer** (le logo Windows en bas), puis clique sur **Terminal (administrateur)**. Sur Windows 10, c'est **Windows PowerShell (administrateur)**. Windows demande « Voulez-vous autoriser cette application… » : clique sur **Oui**.

### 2.1 Vérifier la virtualisation

1. Appuie sur **Ctrl + Maj + Échap** (le Gestionnaire des tâches s'ouvre).
2. Va dans l'onglet **Performance**, puis clique sur **Processeur** (ou **CPU**).
3. Regarde en bas à droite la ligne **Virtualisation**.

✅ Tu dois voir **Virtualisation : Activé**. Passe à l'étape suivante.

⚠️ Si c'est **Désactivé**, il faut l'activer dans le BIOS (le menu qui s'affiche avant Windows) : redémarre le PC et appuie plusieurs fois sur **Suppr** ou **F2** dès l'allumage. Cherche **SVM Mode** (processeur AMD) ou **Intel VT-x** / **Virtualization Technology** (processeur Intel), mets-le sur **Enabled**, puis enregistre et quitte (souvent **F10**). Si tu n'es pas à l'aise, demande de l'aide à l'administrateur de Skyval.

### 2.2 Installer WSL

1. Ouvre PowerShell **en administrateur** (voir plus haut).
2. Copie et colle cette commande, puis **Entrée** :

```powershell
wsl --install
```

3. Attends la fin (quelques minutes), puis **redémarre le PC**.
4. Au redémarrage, une fenêtre **Ubuntu** peut s'ouvrir et demander un nom d'utilisateur et un mot de passe. Choisis-en un simple (il ne sert qu'à ce petit Linux, note-le quelque part). Pendant que tu tapes le mot de passe, rien ne s'affiche : c'est normal. Ferme ensuite cette fenêtre.
5. Rouvre PowerShell **en administrateur** et mets WSL à jour :

```powershell
wsl --update
```

✅ Tu dois voir un message qui dit que la mise à jour est faite, ou que la dernière version est déjà installée.

### 2.3 Limiter la mémoire de WSL

Sans ce réglage, WSL peut garder plus de 15 Go de mémoire pour lui, même quand rien ne tourne. L'IA tourne dans la carte graphique, pas dans la mémoire du PC : 10 Go suffisent.

1. Dans PowerShell (administrateur ou non), copie et colle cette commande, puis **Entrée** :

```powershell
Set-Content -Path "$env:USERPROFILE\.wslconfig" -Value "[wsl2]`nmemory=10GB`n`n[experimental]`nautoMemoryReclaim=dropcache"
```

2. Puis celle-ci, pour que WSL prenne le réglage :

```powershell
wsl --shutdown
```

✅ Rien ne s'affiche : c'est normal, c'est bon.

### 2.4 Mettre à jour le pilote NVIDIA

Le pilote est le logiciel qui fait marcher ta carte graphique. Il doit être récent.

1. Ouvre **NVIDIA App** (ou **GeForce Experience** sur les PC plus anciens). Si tu n'as ni l'un ni l'autre, va sur https://www.nvidia.com/fr-fr/drivers/ et télécharge le pilote de ta carte.
2. Va dans **Pilotes**, puis installe la dernière version proposée.

✅ Tu dois voir que ton pilote est à jour.

⚠️ N'installe **aucun** pilote NVIDIA dans la fenêtre Ubuntu : le pilote Windows suffit, il sert aussi à WSL.

### 2.5 Installer Docker Desktop

1. Va sur https://www.docker.com/products/docker-desktop/ et clique sur **Download for Windows - AMD64**.
2. Ouvre le fichier téléchargé (**Docker Desktop Installer.exe**). Windows demande l'autorisation : **Oui**.
3. Sur l'écran **Configuration**, laisse coché **Use WSL 2 instead of Hyper-V**, puis clique sur **OK**.
4. À la fin, clique sur **Close** (ou **Close and restart** : le PC redémarre).

✅ Tu dois voir l'icône de Docker Desktop (une baleine) dans le menu Démarrer.

### 2.6 Ouvrir Docker Desktop

1. Ouvre **Docker Desktop** depuis le menu Démarrer.
2. Accepte les conditions (**Accept**). S'il te propose de te connecter ou de créer un compte, clique sur **Skip** (passer) : pas besoin de compte.
3. Attends.

✅ Tu dois voir **Engine running** en bas à gauche de la fenêtre de Docker Desktop (avec un point vert).

### 2.7 Lancer Docker Desktop avec Windows

1. Dans Docker Desktop, clique sur la **roue dentée** en haut à droite (Settings).
2. Dans **General**, coche **Start Docker Desktop when you sign in to your computer**.
3. Clique sur **Apply** (ou **Apply & restart**).

✅ Docker Desktop démarrera tout seul à chaque allumage du PC. Skyval Calcul aussi, du coup.

### 2.8 Vérifier que Docker voit ta carte

1. Ouvre PowerShell (pas besoin d'administrateur : clic sur Démarrer, tape `powershell`, puis **Entrée**).
2. Copie et colle cette commande, puis **Entrée** :

```powershell
docker run --rm --gpus all ubuntu nvidia-smi
```

✅ Après un petit téléchargement, tu dois voir un tableau avec le **nom de ta carte** (par exemple « NVIDIA GeForce RTX 3060 »).

⚠️ Si tu vois une erreur à la place, regarde [Ça ne marche pas](#6-ça-ne-marche-pas).

### 2.9 Créer le dossier skyval-calcul

1. Ouvre l'**Explorateur de fichiers** (l'icône en forme de dossier jaune).
2. Va dans **Documents**.
3. Fais un clic droit dans une zone vide → **Nouveau** → **Dossier**, et appelle-le `skyval-calcul`.
4. Ouvre ce dossier (double-clic).

✅ Tu dois voir un dossier vide, et `skyval-calcul` dans la barre d'adresse en haut.

### 2.10 Ouvrir un terminal dans ce dossier

1. Dans l'Explorateur, toujours dans le dossier `skyval-calcul`, clique dans la **barre d'adresse** en haut (là où le chemin est écrit).
2. Efface ce qui est écrit, tape `powershell`, puis **Entrée**.

✅ Une fenêtre PowerShell s'ouvre, et la ligne se termine par `\skyval-calcul>`.

(Sur Windows 11, tu peux aussi faire un clic droit dans le dossier → **Ouvrir dans le Terminal**.)

### 2.11 Télécharger Skyval Calcul

Dans cette fenêtre, copie et colle cette commande, puis **Entrée** :

```powershell
curl.exe -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml
```

✅ Rien ne s'affiche, et un fichier **docker-compose.yml** apparaît dans le dossier `skyval-calcul`.

### 2.12 Lancer Skyval Calcul

Toujours dans la même fenêtre :

```powershell
docker compose up -d
```

✅ Le premier lancement télécharge environ 4 Go (quelques minutes). À la fin, tu dois voir **Container skyval-calcul Started**.

C'est installé. Passe aux [réglages](#4-régler-skyval-calcul).

---

## 3. Installer sur Ubuntu

Ouvre un terminal avec **Ctrl + Alt + T**. Copie chaque commande, colle-la dans le terminal avec **Ctrl + Maj + V**, puis **Entrée**. Quand le terminal demande ton mot de passe, tape-le : rien ne s'affiche pendant que tu tapes, c'est normal.

### 3.1 Installer Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker $USER
```

Déconnecte-toi puis reconnecte-toi (ou redémarre), puis vérifie :

```bash
docker run --rm hello-world
```

✅ Tu dois voir **Hello from Docker!**

### 3.2 Vérifier le pilote NVIDIA

```bash
nvidia-smi
```

✅ Tu dois voir un tableau avec le nom de ta carte et sa mémoire.

⚠️ Si la commande n'existe pas : ouvre **Logiciels et mises à jour** → onglet **Pilotes additionnels**, choisis le pilote NVIDIA conseillé, applique, puis redémarre.

### 3.3 Relier Docker à la carte (NVIDIA Container Toolkit)

Quatre commandes, l'une après l'autre :

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
```

```bash
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

```bash
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
```

```bash
sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker
```

Puis vérifie que Docker voit la carte :

```bash
docker run --rm --gpus all ubuntu nvidia-smi
```

✅ Tu dois voir le même tableau qu'à l'étape 3.2, avec le nom de ta carte.

### 3.4 Lancer Skyval Calcul

```bash
mkdir -p ~/skyval-calcul && cd ~/skyval-calcul
```

```bash
curl -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml
```

```bash
docker compose up -d
```

✅ Le premier lancement télécharge environ 4 Go. À la fin, tu dois voir **Container skyval-calcul Started**. Skyval Calcul se relancera tout seul à chaque démarrage du PC.

---

## 4. Régler Skyval Calcul

### 4.1 Ouvrir la page de réglages

Ouvre ton navigateur (Chrome, Edge, Firefox…) et va sur :

http://localhost:8642

✅ Tu dois voir la page **Skyval Calcul**, avec **À configurer** en haut.

### 4.2 Relier ton PC à Skyval

Dans la zone **Connexion** :

1. **Nom de cette machine** : écris un nom qui te ressemble, par exemple « PC de Léo ».
2. **Clé de la machine** : colle la clé donnée par l'administrateur de Skyval.
3. Clique sur **Enregistrer**.

✅ Après quelques secondes, tu dois voir **Connecté à Atlas ✓** à côté du bouton.

⚠️ Tu vois **Atlas injoignable** ou **Pas connecté** ? Va à l'[étape 4.6](#46-si-atlas-reste-injoignable).

### 4.3 Régler l'utilisation du PC

Dans la zone **Utilisation du PC**, vérifie que le curseur est à **100 %** (c'est le réglage de départ ; s'il est plus bas, pousse-le à fond à droite).

Pourquoi : le curseur dit quelle part de ton PC Skyval peut prendre. Plus bas (par exemple 50 %), le PC se repose entre deux calculs, mais Skyval n'a droit qu'à une partie de la mémoire de la carte. Sur une carte de 12 Go, il faut 100 %, sinon l'IA ne tient pas.

✅ Tu dois voir **100 %** et « Aucune pause entre deux calculs ».

### 4.4 Installer l'IA

Dans la zone **Modèles d'IA** (un modèle, c'est l'IA elle-même) :

1. Sur la ligne **gemma3:12b** (« 12b · validé par Skyval »), clique sur **Installer**. Il y a 8 Go à télécharger : une barre avance en pourcentage.
2. Quand c'est fini, la ligne affiche **utilisé**. Si tu vois un bouton **Utiliser** à la place, clique dessus.

✅ Tu dois voir l'étiquette **utilisé** sur la ligne gemma3:12b.

Avec une carte de **24 Go** (RTX 3090, 4090, 5090…), la page peut aussi te conseiller **gemma4:26b** (19 Go à télécharger) : prends le modèle marqué **conseillé**.

La vitesse de ton PC se mesure toute seule, sur les vrais calculs de Skyval : rien à lancer.

### 4.5 Te rendre disponible

Dans la zone **Disponibilité**, coche les deux interrupteurs :

- **Disponible pour Skyval** : ton PC peut recevoir des calculs.
- **Disponible dès le démarrage du conteneur** : ton PC se rend disponible tout seul à chaque allumage.

✅ Tu dois voir **Disponible** en haut de la page, avec un voyant vert. C'est fini !

Tu peux utiliser ton PC normalement. Pendant un calcul, la page affiche **Calcul en cours** et les réglages sont bloqués, de quelques secondes à quelques minutes. Pour ne plus recevoir de calculs un moment, décoche simplement **Disponible pour Skyval**.

### 4.6 Si Atlas reste injoignable

Atlas est le serveur de Skyval. Chez un invité Tailscale (c'est ton cas si l'administrateur t'a envoyé un lien de partage), Atlas peut avoir **une autre adresse** que celle prévue. Voici comment la trouver.

1. Vérifie d'abord que Tailscale est connecté et que tu as bien accepté le partage ([étape 1.2](#12-installer-tailscale)).
2. Ouvre PowerShell (Windows) ou un terminal (Ubuntu) et tape :

   Windows :

   ```powershell
   & "C:\Program Files\Tailscale\tailscale.exe" status
   ```

   Ubuntu :

   ```bash
   tailscale status
   ```

3. Cherche la ligne qui contient **rpi-atlas**. Le début de la ligne est son adresse, par exemple `100.95.29.37`.
4. Retourne sur http://localhost:8642. Dans **Connexion**, clique sur **Avancé**.
5. Dans **Adresse d'Atlas**, écris `http://` + l'adresse + `:4601`. Par exemple : `http://100.95.29.37:4601`
6. Clique sur **Enregistrer**.

✅ Tu dois voir **Connecté à Atlas ✓**.

---

## 5. Au quotidien

Normalement, **rien à faire** : Skyval Calcul se lance tout seul avec ton PC.

Pour le reste, ouvre un terminal **dans le dossier `skyval-calcul`** ([étape 2.10](#210-ouvrir-un-terminal-dans-ce-dossier) sur Windows, `cd ~/skyval-calcul` sur Ubuntu), puis :

| Pour… | Tape |
|---|---|
| Mettre à jour | Rien à faire : le service « maj » vérifie toutes les heures et installe la nouvelle version tout seul (Skyval Calcul redémarre en quelques secondes). À la main si tu es pressé : `docker compose pull` puis `docker compose up -d` |
| Arrêter | `docker compose down` |
| Relancer | `docker compose up -d` |
| Désinstaller (IA comprise) | `docker compose down -v`, puis supprime le dossier `skyval-calcul` |

**Deux systèmes sur le même PC (Windows et Ubuntu)** : installe Skyval Calcul sur chacun, avec un nom et une clé différents (par exemple « PC fixe (Windows) » et « PC fixe (Ubuntu) »).

---

## 6. Ça ne marche pas

| Ce que tu vois | Quoi faire |
|---|---|
| « docker n'est pas reconnu… » | Docker Desktop n'est pas installé, ou la fenêtre était ouverte avant : ferme PowerShell, rouvre-le et réessaie. Sinon, refais l'[étape 2.5](#25-installer-docker-desktop). |
| « failed to connect to the docker API at npipe:… dockerDesktopLinuxEngine » (souvent avec « unable to get image ») | Docker Desktop n'est pas ouvert. Ouvre-le, attends **Engine running**, puis relance `docker compose up -d`. S'il ne démarre pas : étapes [2.1](#21-vérifier-la-virtualisation) et [2.2](#22-installer-wsl). |
| Docker Desktop affiche « WSL 2 installation is incomplete », ou ne démarre pas | Dans PowerShell **administrateur**, tape `wsl --update`, redémarre le PC, et vérifie la virtualisation ([étape 2.1](#21-vérifier-la-virtualisation)). |
| `wsl --install` affiche une aide au lieu d'installer | WSL est déjà là. Tape `wsl --update`, puis `wsl --set-default-version 2`. |
| « Impossible de trouver un paramètre correspondant au nom « fsSLO » » | Tu as tapé `curl` au lieu de `curl.exe`. Copie la commande de l'[étape 2.11](#211-télécharger-skyval-calcul) telle quelle. |
| « 'Invoke-WebRequest' n'est pas reconnu » | Tu es dans l'Invite de commandes (cmd) : utilise la commande avec `curl.exe` de l'[étape 2.11](#211-télécharger-skyval-calcul), elle marche aussi là. |
| « unexpected EOF » pendant un téléchargement | La connexion a été coupée. Relance la même commande : ce qui est déjà téléchargé est gardé. |
| « could not select device driver nvidia » | Docker ne voit pas ta carte NVIDIA. Windows : pilote à jour ([étape 2.4](#24-mettre-à-jour-le-pilote-nvidia)) et Docker Desktop installé avec WSL 2. Ubuntu : refais l'[étape 3.3](#33-relier-docker-à-la-carte-nvidia-container-toolkit). Sans carte NVIDIA, Skyval Calcul ne peut pas marcher sur ce PC. |
| Ubuntu : « permission denied » avec `docker` | Tu ne t'es pas déconnecté puis reconnecté après l'[étape 3.1](#31-installer-docker). Fais-le, ou ajoute `sudo` devant la commande. |
| http://localhost:8642 ne s'ouvre pas | Docker Desktop est-il ouvert (**Engine running**) ? Puis, dans le dossier `skyval-calcul`, tape `docker compose up -d`. Si ça ne suffit pas, `docker logs skyval-calcul` montre l'erreur : envoie-la à l'administrateur de Skyval. |
| **Atlas injoignable** | Suis l'[étape 4.6](#46-si-atlas-reste-injoignable). |
| **Clé refusée** | La clé est mal collée, ou elle a été supprimée. Recolle-la, ou demande-en une nouvelle à l'administrateur de Skyval. |
| Dans la zone **Cette machine**, la carte graphique est « Aucune » | Docker ne voit pas ta carte. Windows : pilote NVIDIA à jour et Docker Desktop en mode WSL 2. Ubuntu : refais l'[étape 3.3](#33-relier-docker-à-la-carte-nvidia-container-toolkit). Puis `docker compose down` et `docker compose up -d`. |
| **Carte trop faible** | Ta carte graphique a moins de 12 Go (ou Docker ne la voit pas : voir la ligne au-dessus). Ce PC ne peut pas recevoir de calculs. |
| « Aucun modèle ne tient dans la mémoire autorisée : monte le curseur » | Pousse le curseur **Utilisation du PC** à 100 % ([étape 4.3](#43-régler-lutilisation-du-pc)). |
| **Modèle retiré**, ou une zone **Anciens modèles** | Ce modèle n'est plus utilisé par Skyval. Installe gemma3:12b ([étape 4.4](#44-installer-lia)), puis supprime l'ancien avec sa poubelle. |
| Un calcul dure plus de 20 secondes par vote | Mets le curseur à 100 %. Si tu utilises gemma4:26b, reviens à gemma3:12b. |
| Windows : « VmmemWSL » prend beaucoup de mémoire dans le Gestionnaire des tâches | Refais l'[étape 2.3](#23-limiter-la-mémoire-de-wsl), puis rouvre Docker Desktop. |

Toujours bloqué ? Envoie une capture d'écran à l'administrateur de Skyval.

---

## 7. Pour l'administrateur de Skyval

*Cette partie n'est pas pour les utilisateurs.*

- **Une clé par machine** : immeuble → hall → *Réseau de calcul* → *+ Machine*. La clé ne s'affiche qu'une fois.
  Supprimer la machine coupe sa clé.
- **Priorité** : dans le même bloc, la machine allumée la plus haute prend le mail suivant.
- **Partager Atlas** : console Tailscale → Machines → Atlas → *Share…*, puis envoie le lien. Pour que les machines
  partagées n'atteignent que le port du calcul, ajoute dans les ACL Tailscale
  `{ "action": "accept", "src": ["autogroup:shared"], "dst": ["<nom d'Atlas>:4601"] }`
  et vérifie qu'aucune autre règle ne donne `*:*` à `autogroup:shared`.
- **Publier une nouvelle version** : push sur `main`. GitHub construit l'image (`.github/workflows/image.yml`) et la
  publie sur Docker Hub (`thibaud165/skyval-calcul`, celle des fichiers docker-compose) et sur ghcr.io (copie de secours,
  plus lente au téléchargement). Secrets du dépôt GitHub nécessaires : `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN`
  (jeton Docker Hub « Read & Write »).
