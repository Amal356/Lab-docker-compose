# Application Gestionnaire de Tâches - TP Docker Compose

Ce dépôt contient le code source et la configuration Docker pour une application de gestion de tâches suivant une architecture trois-tiers, comme demandé pour le laboratoire.

## Architecture

L'application est divisée en 3 services principaux :
1. **Frontend** : React (Vite) servi via Nginx sur le port 8080 de l'hôte. L'image utilise un build multi-stage (builder Node, serveur Nginx). Nginx est configuré pour agir comme un reverse proxy (`/api` vers le backend).
2. **Backend** : Node.js (Express) sur le port 5000. Il utilise un build multi-stage avec une image Alpine de production allégée et s'exécute en tant qu'utilisateur non-root. Il dépend du service `database`.
3. **Base (Database)** : PostgreSQL 15. Configuré avec un volume persistant nommé `taskmanager-data` et un script d'initialisation (`init.sql`).

Les réseaux sont segmentés (`frontend-net` et `backend-net`) pour garantir qu'aucune communication directe n'est possible entre le frontend et la base de données (principe de moindre privilège).

## Guide de Configuration de la Base de Données (Locale sur PC)

Pour utiliser votre propre base de données PostgreSQL installée sur votre PC avec Docker :

### 1. Préparation de PostgreSQL sur votre PC
- Ouvrez votre outil de gestion PostgreSQL (ex: pgAdmin ou psql).
- Créez une base de données nommée `taskmanager`.
- Assurez-vous que l'utilisateur `postgres` a un mot de passe (ex: `votre_password`).

### 2. Autoriser les connexions externes
Par défaut, PostgreSQL bloque les connexions venant de Docker. 
- Trouvez votre fichier `pg_hba.conf` (souvent dans le dossier Data de PostgreSQL).
- Ajoutez cette ligne à la fin : `host all all 0.0.0.0/0 md5`
- Dans `postgresql.conf`, assurez-vous que `listen_addresses = '*'` est activé.
- Redémarrez le service PostgreSQL.

### 3. Récupérer votre adresse IP locale
- Sur Windows : Tapez `ipconfig` dans un terminal et cherchez "Adresse IPv4" (ex: `192.168.1.15`).
- Sur Mac/Linux : Tapez `ifconfig` ou `ip addr`.

### 4. Configurer le projet
- Créez un fichier nommé `.env` à la racine du projet.
- Ajoutez la ligne suivante en remplaçant par vos infos :
  ```env
  DATABASE_URL=postgres://postgres:votre_password@192.168.1.15:5432/taskmanager
  ```
  *(Note : Sur Docker Desktop pour Windows/Mac, vous pouvez aussi essayer `host.docker.internal` au lieu de l'IP).*

### 5. Lancement
```bash
docker-compose up -d --build
```
Le backend se connectera désormais directement à votre base de données locale.

## Lancement de l'application

1. (Optionnel) Créez un fichier `.env` à la racine pour personnaliser vos variables :
   ```env
   DB_NAME=taskmanager
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```
2. Lancez Docker Compose :
   ```bash
   docker-compose up -d --build
   ```
3. L'application (frontend) est disponible sur : [http://localhost:8080](http://localhost:8080)

## Questions de Réflexion (Partie 2.1 du TP)

### 1. Pourquoi utiliser un multi-stage build plutôt qu'un Dockerfile simple ?
Le multi-stage build permet de séparer l'environnement de construction (compilation, installation des dépendances de développement) de l'environnement d'exécution final. Cela permet d'obtenir une image de production propre et optimisée.

### 2. Quels sont les avantages en termes de taille d'image ?
Cela réduit considérablement la taille de l'image finale car elle ne contient que les artefacts nécessaires à l'exécution (fichiers compilés, dépendances de production) et non les outils de build (SDK, compilateurs, cache de gestionnaire de paquets).

### 3. Comment cela améliore-t-il la sécurité ?
En éliminant les outils de développement (compilateurs, shells, gestionnaires de paquets) de l'image finale, on réduit la surface d'attaque. De plus, cela évite de laisser des secrets ou des clés SSH utilisés pendant le build dans les couches de l'image de production.

### 4. Que contient chaque stage et pourquoi ?
- **Stage 1 (Builder)** : Contient l'image de base complète (Node.js full), le code source, et toutes les dépendances. Il sert à compiler l'application.
- **Stage 2 (Production)** : Contient une image de base minimale (Alpine), les fichiers compilés (`dist/`), et uniquement les dépendances nécessaires au runtime. Il sert à exécuter l'application de manière sécurisée et légère.

## Tests et Validation (Partie 6 du TP)

### Test 1 : Connectivité Base de Données
Le backend se connecte avec succès à la base de données (via l'URL injectée `DATABASE_URL`). Vous pouvez le vérifier via les logs :
```bash
docker-compose logs backend
```
*(Résultat attendu : le serveur est démarré et a inséré/validé les données dans PostgreSQL sans erreur).*

### Test 2 : API Backend
Vous pouvez tester l'endpoint `/health` configuré :
```bash
# Depuis le conteneur frontend :
docker exec -it task_frontend wget -qO- http://backend:5000/health
```
*(Résultat attendu : `{"status":"ok"}`)*
Vous pouvez également tester les endpoints API (ex: GET `/api/tasks`).

### Test 3 : Frontend
L'interface est accessible sur le port 8080. Le routage fonctionne (grâce à Nginx) et les appels API (fetch via `/api/...`) sont automatiquement redirigés vers le backend. Vous pouvez tester la création, lecture, modification et suppression des tâches via le navigateur.

### Test 4 : Isolation Réseau
Le frontend (sur `frontend-net`) n'a pas accès à la base de données (sur `backend-net`).
Pour le prouver, tentez de contacter `database` depuis `task_frontend` :
```bash
docker exec -it task_frontend ping database
```
*(Résultat attendu : `ping: bad address 'database'` car la résolution DNS échoue, confirmant l'isolation).*

### Test 5 : Persistance des Données
Le volume Docker nommé `taskmanager-data` garantit la persistance.
1. Ajoutez une tâche depuis l'interface web.
2. Arrêtez les conteneurs : `docker-compose down`
3. Redémarrez : `docker-compose up -d`
4. Rafraîchissez l'interface web : la tâche ajoutée est toujours présente !

### Test 6 : Limites de Ressources
Vous pouvez vérifier les contraintes CPU/Mémoire définies pour chaque service (0.5/0.25 core et RAM) :
```bash
docker stats
```
*(Résultat attendu : affichage des limites CPU et MEM LIMIT conformes au docker-compose.yml).*

### Test 7 : Health Checks
- Vérifier que tous les conteneurs passent à l'état "healthy" (`docker-compose ps`).
- Tester l'arrêt de la base de données et observer le changement d'état.

## Captures d'Écran Obligatoires (Partie 6.3 du TP)

Les captures suivantes sont disponibles dans le dossier `/screenshots/` :
1. **Services Up et Healthy** : `docker-compose ps` montrant tous les services.
2. **Réseaux** : `docker network ls` montrant `frontend-net` et `backend-net`.
3. **Volumes** : `docker volume ls` montrant `taskmanager-data`.
4. **Limites de Ressources** : `docker stats` montrant les contraintes appliquées.
5. **Interface Frontend** : La page d'accueil avec les tâches.
6. **Ajout de Données** : Screenshot après avoir créé une nouvelle tâche.
7. **Logs de Connexion** : `docker-compose logs backend` montrant la réussite de la connexion DB.
8. **Isolation Réseau** : Échec du ping/curl depuis le frontend vers la database.
9. **Health Check Status** : `docker inspect` montrant le statut détaillé.
10. **Comparaison Multi-stage** : Note sur l'optimisation de la taille des images.

## Commandes Utiles

- **Démarrage** : `docker-compose up -d --build`
- **Arrêt** : `docker-compose down`
- **Logs** : `docker-compose logs -f [service]`
- **Statistiques** : `docker stats`