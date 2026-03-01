# Application Gestionnaire de Tâches - TP Docker Compose

Ce dépôt contient l'implémentation d'une application web full-stack conteneurisée avec Docker Compose, répondant aux exigences du laboratoire.

## Architecture du Projet

L'application suit une architecture trois-tiers isolée :
- **Frontend** : React (Vite) servi par Nginx (port 8080). L'image utilise un multi-stage build et Nginx agit comme reverse proxy.
- **Backend** : API Express (port 5000) gérant la logique métier. Image optimisée via multi-stage build et utilisateur non-root.
- **Base de données** : PostgreSQL 15 avec volume persistant `taskmanager-data` et script d'initialisation.

La sécurité est assurée par une **segmentation réseau** :
- `frontend-net` : Connexion Frontend ↔ Backend.
- `backend-net` : Connexion Backend ↔ Database.
- Le frontend ne peut pas communiquer directement avec la base de données (principe de moindre privilège).

## Installation et Lancement

1. Clonez le dépôt.
2. (Optionnel) Créez un fichier `.env` à la racine :
   ```env
   DB_NAME=taskmanager
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```
3. Lancez l'orchestration complète :
   ```bash
   docker-compose up -d --build
   ```
4. Accédez à l'application sur : [http://localhost:8080](http://localhost:8080)

---

## Questions de Réflexion (Partie 2.1)

1. **Pourquoi le multi-stage build ?** Pour séparer l'environnement de build (dépendances dev, compilateurs) du runtime final, garantissant une image propre et légère.
2. **Avantages de taille ?** Réduction massive de l'image finale en n'incluant que les fichiers compilés et les dépendances de production.
3. **Sécurité ?** Réduction de la surface d'attaque en éliminant les outils de build et les fichiers sources du conteneur de production.
4. **Contenu des stages ?** Le stage 1 (Builder) contient tout l'environnement nécessaire à la compilation. Le stage 2 (Production) ne contient que l'exécutable et le strict nécessaire pour tourner.

---

## Tests et Validation (Partie 6.2)

### 1. Connectivité Base de Données
**Commande** : `docker-compose logs backend`
**Résultat attendu** : Confirmation que le serveur est démarré et connecté à PostgreSQL.

### 2. API Backend (Health Check)
**Commande** : `curl http://localhost:5000/health` (ou via le conteneur frontend)
**Résultat attendu** : `{"status":"ok"}`

### 3. Frontend & CRUD
**Action** : Utiliser l'interface sur le port 8080 pour ajouter, modifier et supprimer une tâche.
**Résultat attendu** : Les opérations sont instantanément reflétées dans l'UI.

### 4. Isolation Réseau (Sécurité)
**Commande** : `docker exec task_frontend ping database`
**Résultat attendu** : `ping: bad address 'database'`. Prouve que le frontend ne voit pas la base de données.

### 5. Persistance des Données
**Action** : Ajouter une tâche, faire `docker-compose down`, puis `docker-compose up -d`.
**Résultat attendu** : La tâche est toujours présente (stockée dans le volume `taskmanager-data`).

### 6. Limites de Ressources
**Commande** : `docker stats`
**Résultat attendu** : Vérification que les limites CPU et RAM définies dans le Compose sont respectées.

### 7. Health Checks
**Commande** : `docker-compose ps`
**Résultat attendu** : Tous les services affichent l'état `(healthy)`.

---

## Captures d'Écran Obligatoires (Dossier /screenshots/)

1. `Services Up et Healthy.png` : docker-compose ps.
2. `Réseaux.png` : docker network ls.
3. `volumes.png` : docker volume ls.
4. `Limites de Ressources.png` : docker stats.
5. `la page d'accueil avec les tâches.png` : UI Frontend.
6. `Taches creer .png` : Test d'ajout de données.
7. `Logs de Connexion.png` : Logs backend → database.
8. `Isolation Réseau.png` : Échec de connexion frontend → database.
9. `Health check status.png` : Status dans docker inspect.
10. `Comparaison Multi-stage.png` : Note sur l'optimisation.

---

## Commandes Utiles

- `docker-compose up -d --build` : Démarrage.
- `docker-compose down` : Arrêt complet.
- `docker-compose logs -f [service]` : Voir les logs.
- `docker stats` : Voir la consommation de ressources.
