# Skyval Calcul

## Sommaire

1. [Ce qu'il te faut](#1-ce-quil-te-faut)
2. [Installer Docker](#2-installer-docker) : [Windows](#windows-10-et-11) · [Linux](#linux) · [macOS](#macos)
3. [Lancer Skyval Calcul](#3-lancer-skyval-calcul)
4. [Régler dans l'interface](#4-régler-dans-linterface)
5. [Au quotidien](#5-au-quotidien)
6. [Ça ne marche pas](#6-ça-ne-marche-pas)
7. [Pour l'administrateur de Skyval](#7-pour-ladministrateur-de-skyval)

---

## 1. Ce qu'il faut

| **Outils** | Informations |
|---|---|
| **Tailscale** | installé et connecté (https://tailscale.com/download), avec le partage d'Atlas accepté : l'administrateur de Skyval t'envoie le lien |
| **Une clé** | une par machine, donnée par l'administrateur de Skyval |
| **Docker** | voir l'étape 2 |
| **Disque** | 7 à 20 Go libres selon le modèle choisi |
| **Carte graphique** | une carte NVIDIA avec au moins 8 Go de mémoire. Sans elle, Skyval Calcul ne peut pas aider : les modèles assez fiables sont trop lourds pour le processeur seul |

Les cartes AMD et Intel ne sont pas utilisées : le PC est alors vu comme sans carte graphique.

## 2. Installer Docker

### Windows 10 et 11

Docker a besoin de **WSL 2** (le sous-système Linux de Windows). Il faut l'installer en premier.

**a. Vérifier que la virtualisation est activée**

Gestionnaire des tâches (Ctrl + Maj + Échap) → Performance → Processeur → en bas à droite, « Virtualisation : Activé ».
Si elle est désactivée, active-la dans le BIOS : « SVM Mode » pour un processeur AMD, « Intel VT-x » ou « Virtualization
Technology » pour un Intel. Redémarre ensuite.

**b. Installer WSL 2**

Clic droit sur le menu Démarrer → « Terminal (administrateur) » ou « Windows PowerShell (administrateur) », puis :

```powershell
wsl --install
```

Redémarre le PC quand c'est fini. Au redémarrage, une fenêtre Ubuntu peut s'ouvrir et demander un nom d'utilisateur et
un mot de passe : choisis-en un (il ne sert qu'à ce Linux). Ensuite, mets WSL à jour et vérifie la version :

```powershell
wsl --update
```

```powershell
wsl --status
```

La ligne « Version par défaut : 2 » (ou « Default Version: 2 ») doit apparaître. Si c'est 1 :

```powershell
wsl --set-default-version 2
```

**c. Pilote de la carte graphique**

Avec une carte NVIDIA : installe le dernier pilote **Windows** (GeForce Experience, NVIDIA App ou nvidia.com). Il sert
aussi à WSL. N'installe **aucun** pilote NVIDIA à l'intérieur d'Ubuntu/WSL.

**d. Installer Docker Desktop**

1. Télécharge Docker Desktop : https://www.docker.com/products/docker-desktop/
2. À l'installation, laisse coché « Use WSL 2 instead of Hyper-V ».
3. Redémarre si on te le demande, ouvre Docker Desktop, accepte les conditions, et attends « Engine running » en bas à gauche.
4. Pour qu'il se lance avec Windows : Settings → General → « Start Docker Desktop when you sign in to your computer ».

Vérifie dans PowerShell :

```powershell
docker run --rm hello-world
```

Avec une carte NVIDIA, vérifie aussi que Docker la voit :

```powershell
docker run --rm --gpus all ubuntu nvidia-smi
```

Le nom de ta carte doit s'afficher.

### Linux

Pour Ubuntu, Debian, Fedora, Linux Mint et la plupart des autres distributions :

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker $USER
```

Déconnecte-toi puis reconnecte-toi (ou redémarre) pour pouvoir utiliser `docker` sans `sudo`. Vérifie :

```bash
docker run --rm hello-world
```

**Avec une carte NVIDIA**, le pilote doit déjà être installé (`nvidia-smi` doit afficher ta carte). Ajoute ensuite le lien
entre Docker et la carte (NVIDIA Container Toolkit). Pour Ubuntu et Debian :

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

Pour les autres distributions : https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html

Vérifie que Docker voit la carte :

```bash
docker run --rm --gpus all ubuntu nvidia-smi
```

## 3. Lancer Skyval Calcul

Crée un dossier `skyval-calcul` où tu veux et ouvre un terminal dedans. Prends ensuite **uniquement** le bloc de ton
système : les commandes Linux ne marchent pas dans PowerShell, et inversement.

### Windows (PowerShell ou Invite de commandes)

Dans l'Explorateur, ouvre le dossier `skyval-calcul`, tape `powershell` dans la barre d'adresse puis Entrée.
Les commandes ci-dessous marchent aussi dans l'Invite de commandes (cmd), à condition d'être dans le dossier `skyval-calcul`.

**Avec une carte NVIDIA** :

```powershell
curl.exe -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml
```

```powershell
docker compose up -d
```

**Sans carte NVIDIA** (l'interface marche, mais aucun modèle ne tient : le PC ne prendra pas de calculs) :

```powershell
curl.exe -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.cpu.yml
```

```powershell
docker compose -f docker-compose.cpu.yml up -d
```

### Linux et macOS (Terminal)

**Avec une carte NVIDIA (Linux)** :

```bash
curl -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml
```

```bash
docker compose up -d
```

**Sans carte NVIDIA, ou sur Mac** (l'interface marche, mais aucun modèle ne tient : le PC ne prendra pas de calculs) :

```bash
curl -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.cpu.yml
```

```bash
docker compose -f docker-compose.cpu.yml up -d
```

Le premier lancement télécharge l'image depuis Docker Hub (environ 4 Go, une seule fois). Le conteneur redémarre ensuite tout seul avec Docker, donc avec
ton PC si Docker démarre avec lui.

## 4. Régler dans l'interface

Ouvre http://localhost:8642 dans ton navigateur.

1. **Connexion** : donne un nom à ta machine (ex. « PC de Léo » ou « PC fixe (Windows) ») et colle la clé reçue, puis clique sur *Enregistrer*.
   « Connecté à Atlas ✓ » apparaît.
2. **Utilisation du PC** : le curseur dit quelle part de ton PC Skyval peut prendre.
   - À 100 %, aucune pause, et toute la mémoire de la carte graphique compte.
   - À 50 %, le PC se repose autant de temps qu'il a calculé, et seule la moitié de la mémoire compte pour choisir le modèle.
   Tu peux continuer à utiliser ton PC normalement.
3. **Tester ma machine** : regarde ta carte graphique, ta mémoire et le curseur, puis conseille un modèle.
4. **Installer** le modèle conseillé (de 6 à 19 Go à télécharger), puis relance le test : il mesure le temps d'un vote.
5. **Disponible pour Skyval** : coche. Avec « Disponible dès le démarrage du conteneur », ton PC se rend disponible tout seul à chaque démarrage.

Pendant un calcul, l'interface affiche « Calcul en cours » et les réglages sont bloqués, de quelques secondes à quelques
minutes : le temps de trier un mail, soit 5 à 10 votes par question.

| Modèle | Téléchargement | Mémoire | Pour quelle carte |
|---|---|---|---|
| ministral-3:8b | 6 Go | 7,5 Go | 8 Go, curseur à fond (RTX 3060 Ti, 3070, 4060, 4060 Ti 8 Go…) |
| gemma3:12b | 8,1 Go | 9,5 Go | 12 Go (RTX 3060 12 Go, 4070, 4070 SUPER…) |
| ministral-3:14b | 9,1 Go | 10,5 Go | 12 Go curseur à fond, 16 Go (RTX 4060 Ti 16 Go, 4070 Ti SUPER, 4080…) |
| gemma4:26b | 18,7 Go | 20,5 Go | 24 Go (RTX 3090, 4090, 5090…) |

Le test conseille le plus gros modèle qui tient dans la mémoire autorisée par le curseur. Sans carte graphique, ou avec
une carte de moins de 8 Go, aucun modèle n'est proposé : les petits modèles se trompent trop pour trier les mails.

Les anciens modèles (gemma3:1b, gemma3:4b, gemma3:27b) ne sont plus utilisés par Skyval. S'ils sont encore installés,
ils apparaissent sous « Anciens modèles » avec un bouton pour les supprimer du disque, et ce PC ne prend plus de calculs
tant que l'un d'eux est le modèle utilisé : installe un modèle de la liste.

## 5. Au quotidien

| | Commande (dans le dossier `skyval-calcul`) |
|---|---|
| Mettre à jour | `docker compose pull` puis `docker compose up -d` |
| Arrêter | `docker compose down` |
| Relancer | `docker compose up -d` |
| Voir ce qu'il fait | `docker logs -f skyval-calcul` |
| Tout supprimer (modèles compris) | `docker compose down -v` |

Avec `docker-compose.cpu.yml`, ajoute `-f docker-compose.cpu.yml` après `docker compose`.

**Plusieurs systèmes sur le même PC (double démarrage Linux + Windows)** : installe Skyval Calcul sur chacun, avec un nom
et une clé différents (ex. « PC fixe (Linux) » et « PC fixe (Windows) »). Chaque système garde ses propres modèles.

## 6. Ça ne marche pas

| Ce que tu vois | Quoi faire |
|---|---|
| « Atlas injoignable » | Tailscale est-il connecté ? Le partage d'Atlas est-il accepté ? Teste `ping 100.95.29.38`. |
| « Clé refusée » | La clé est mal collée, ou elle a été supprimée : demande-en une nouvelle à l'administrateur. |
| Windows : Docker Desktop affiche « WSL 2 installation is incomplete » ou ne démarre pas | Relance `wsl --update` dans PowerShell (administrateur), redémarre, et vérifie que la virtualisation est activée (étape 2a). |
| Windows : « Impossible de trouver un paramètre correspondant au nom « fsSLO » » | Dans PowerShell, `curl` seul n'est pas le vrai curl : écris `curl.exe` (bloc Windows de l'étape 3). |
| Windows : « 'Invoke-WebRequest' n'est pas reconnu » | Tu es dans l'Invite de commandes (cmd) : utilise `curl.exe` (étape 3), qui marche partout. |
| « unexpected EOF » pendant le téléchargement | La connexion a été coupée : relance la même commande, ce qui est déjà téléchargé est gardé. |
| Windows : `wsl --install` affiche l'aide au lieu d'installer | WSL est déjà là : fais `wsl --update` puis `wsl --set-default-version 2`. |
| Le test dit « Aucune » carte graphique | Windows : pilote NVIDIA à jour et Docker Desktop en mode WSL 2. Linux : refais l'installation de `nvidia-container-toolkit`. Puis `docker compose down` et `docker compose up -d`. |
| `docker compose up` dit « could not select device driver nvidia » | Docker ne voit pas de carte NVIDIA : vérifie avec `docker run --rm --gpus all ubuntu nvidia-smi`, sinon utilise `docker-compose.cpu.yml`. |
| Linux : « permission denied » sur `docker` | Tu ne t'es pas reconnecté après `usermod`, ou ajoute `sudo` devant la commande. |
| Un vote prend plus de 20 s | Prends un modèle plus petit, ou monte le curseur. |
| « Carte trop faible » | Aucun modèle ne tient dans la carte graphique de ce PC (ou Docker ne la voit pas : voir « Aucune » carte graphique ci-dessus). |
| « Modèle retiré » | Le modèle utilisé n'est plus dans la liste de Skyval : installe un modèle de la liste, puis supprime l'ancien. |
| http://localhost:8642 ne s'ouvre pas | `docker ps` doit afficher `skyval-calcul`. Sinon, `docker logs skyval-calcul` donne l'erreur. |

---

## 7. Pour l'administrateur de Skyval

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
