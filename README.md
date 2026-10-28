# Skyval Calcul

Prête la carte graphique de ton PC à **Skyval** pour trier les réponses à ses mails, avec une petite IA (Ollama) qui tourne
chez toi. Quand ton PC est allumé et « disponible », le serveur de Skyval (Atlas) lui envoie des calculs. Quand il est
éteint ou « indisponible », rien ne se passe et Skyval attend.

- Tout tourne dans **un seul conteneur Docker**, le même sous Linux et Windows.
- **Aucun port à ouvrir** : c'est ton PC qui va chercher les calculs chez Atlas, par Tailscale. Atlas ne peut rien faire sur ton PC.
- Une **interface web** sur ton PC : http://localhost:8642 (disponible ou pas, part du PC autorisée, choix du modèle).
- Ce que ton PC reçoit : le texte de réponses de commerçants aux mails de Skyval, le temps d'un calcul. Rien n'est gardé.

---

## 1. Ce qu'il te faut

| | |
|---|---|
| **Tailscale** | https://tailscale.com/download, connecté, et le partage d'Atlas accepté (lien envoyé par Thibaud) |
| **Docker** | voir l'étape 2 |
| **La clé de ta machine** | Thibaud la crée dans l'immeuble Skyval et te l'envoie |
| Conseillé | une carte graphique NVIDIA avec au moins 6 Go (sinon ça marche sur le processeur, en plus lent) |

## 2. Installer Docker

### Windows 10 / 11

1. Mets à jour le pilote de ta carte NVIDIA (GeForce Experience ou nvidia.com).
2. Installe **Docker Desktop** : https://www.docker.com/products/docker-desktop/ (laisse coché « Use WSL 2 »), puis redémarre.
3. Ouvre Docker Desktop une fois et attends qu'il affiche « Engine running ».
4. Pour qu'il se lance avec Windows : Docker Desktop → Settings → General → « Start Docker Desktop when you sign in ».

La carte graphique est utilisée toute seule, rien d'autre à installer.

### Ubuntu / Debian

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker $USER
```

Déconnecte-toi puis reconnecte-toi (ou redémarre). Avec une carte NVIDIA (pilote déjà installé : `nvidia-smi` doit marcher), ajoute le lien Docker ↔ carte graphique :

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
```

```bash
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

```bash
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit && sudo nvidia-ctk runtime configure --runtime=docker && sudo systemctl restart docker
```

## 3. Lancer Skyval Calcul

Crée un dossier `skyval-calcul`, mets-y le fichier [`docker-compose.yml`](docker-compose.yml)
(ou [`docker-compose.cpu.yml`](docker-compose.cpu.yml) si tu n'as pas de carte NVIDIA), puis dans ce dossier :

**Linux**

```bash
curl -fsSLO https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml
```

```bash
docker compose up -d
```

**Windows (PowerShell)**

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/Thibaud165/skyval-calcul/main/docker-compose.yml -OutFile docker-compose.yml
```

```powershell
docker compose up -d
```

Sans carte NVIDIA : remplace `docker-compose.yml` par `docker-compose.cpu.yml` dans la 1re commande, et lance
`docker compose -f docker-compose.cpu.yml up -d`.

Le conteneur redémarre tout seul avec Docker (donc avec ton PC si Docker démarre avec lui).

## 4. Régler dans l'interface : http://localhost:8642

1. **Connexion** : un nom pour ta machine (ex. « PC de Léo ») et la clé donnée par Thibaud → *Enregistrer*.
   La pastille passe à « Connecté à Atlas ✓ ».
2. **Utilisation du PC** : le curseur dit quelle part du PC Skyval peut prendre.
   À 50 %, ton PC se repose autant de temps qu'il a calculé, et seule la moitié de la mémoire de ta carte graphique compte
   pour choisir le modèle. Tu peux continuer à utiliser ton PC normalement.
3. **Tester ma machine** : regarde ta carte graphique, ta mémoire et le curseur, et conseille un modèle.
4. **Installer** le modèle conseillé (téléchargement de 1 à 17 Go selon le modèle), puis relance le test : il mesure le temps d'un vote.
5. **Disponible pour Skyval** : coche. « Disponible dès le démarrage du conteneur » : coché, ton PC se rend disponible tout seul à chaque démarrage.

Pendant un calcul, l'interface affiche « Calcul en cours » et les réglages sont bloqués quelques secondes à quelques minutes
(le temps de trier un mail : 5 à 10 votes par question).

| Modèle | Mémoire | Pour qui |
|---|---|---|
| gemma3:1b | 1,5 Go | dépannage, se trompe souvent |
| gemma3:4b | 4,5 Go | petite carte (6 Go) ou processeur seul |
| gemma3:12b | 9,5 Go | carte de 12 Go et plus (RTX 3060 12 Go, 4070…) |
| gemma3:27b | 19 Go | carte de 24 Go (RTX 3090, 4090) |

## 5. Au quotidien

| | Linux | Windows (PowerShell) |
|---|---|---|
| Mettre à jour | `docker compose pull && docker compose up -d` | `docker compose pull; docker compose up -d` |
| Arrêter | `docker compose down` | `docker compose down` |
| Relancer | `docker compose up -d` | `docker compose up -d` |
| Voir ce qu'il fait | `docker logs -f skyval-calcul` | `docker logs -f skyval-calcul` |
| Tout supprimer (modèles compris) | `docker compose down -v` | `docker compose down -v` |

Tu as Linux et Windows sur le même PC (double démarrage) ? Installe-le sur les deux, avec deux noms différents
(« PC de Thibaud (Ubuntu) », « PC de Thibaud (Windows) ») : chaque système a sa propre clé et ses propres modèles.

## 6. Ça ne marche pas

| Ce que tu vois | Quoi faire |
|---|---|
| « Atlas injoignable » | Tailscale est-il connecté ? Le partage d'Atlas est-il accepté ? Teste `ping 100.95.29.38` depuis ton PC. |
| « Clé refusée » | La clé a été mal collée, ou Thibaud l'a supprimée : demande-lui une nouvelle clé. |
| Le test dit « Aucune » carte graphique | Windows : pilote NVIDIA à jour + Docker Desktop en mode WSL 2. Linux : refais l'étape `nvidia-container-toolkit`, puis `docker compose down && docker compose up -d`. |
| `docker compose up` dit « could not select device driver nvidia » | Pas de carte NVIDIA reconnue : utilise `docker-compose.cpu.yml`. |
| Un vote prend plus de 20 s | Prends un modèle plus petit, ou monte le curseur. |

---

## Pour Thibaud

- **Une clé par machine** : immeuble → hall → *Réseau de calcul* → *Ajouter une machine*. La clé ne s'affiche qu'une fois.
- **Partager Atlas avec un pote** : console Tailscale → Machines → rpi-atlas → *Share…* → envoie-lui le lien.
  Pour qu'il ne voie que le port du calcul, ajoute dans les ACL de Tailscale :
  `{ "action": "accept", "src": ["autogroup:shared"], "dst": ["rpi-atlas:4601"] }`
  (et vérifie qu'aucune autre règle ne donne `*:*` à `autogroup:shared`).
- **Publier une nouvelle version** : push sur `main`, GitHub construit l'image (`.github/workflows/image.yml`).
  La première fois : GitHub → ton profil → Packages → skyval-calcul → Package settings → *Change visibility* → Public.
