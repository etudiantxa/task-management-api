# Projet de Gestion de Tâches NestJS

Ce projet est une application NestJS qui gère des tâches avec une API CRUD. Elle utilise SQLite comme base de données. Le projet possède deux branches :
- `main` : Expose une API CRUD pour les tâches.
- `with-auth` : Ajoute des fonctionnalités d'authentification, y compris l'inscription, la connexion, la mise à jour du profil, et nécessite une authentification pour effectuer les opérations CRUD sur les tâches.

# Comment Exécuter le Projet en Local
## Prérequis
- Node.js (>=14.x)
- npm (>=6.x)
- SQLite
- Installation

## 1. Clonez le dépôt :

## 2. Installez les dépendances :
```bash
npm install
```

## 3. Créez et configurez la base de données SQLite :
- Assurez-vous que SQLite est installé.
- Configurez le fichier config/config.json avec les paramètres appropriés.

## 4. Exécutez les migrations :
```bash
npx sequelize-cli db:migrate
```

## 5. Configuration des variables d'environnement
Copiez le fichier `.env.example` et nommez-le `.env`, puis mettez à jour les valeurs selon votre configuration :

```bash
cp .env.example .env
```

# Exécution du Projet
1. Démarrez le serveur NestJS :
```bash
npm run start
```

2. Le serveur devrait maintenant être en cours d'exécution à `http://localhost:3000`.

3. Le projet utilise Swagger pour la documentation de l'API. Après avoir démarré le serveur, vous pouvez accéder à la documentation de l'API à `http://localhost:3000/api-docs`

# Branches

## Branche `main`

La branche `main` expose une API CRUD pour les tâches. Vous pouvez utiliser cette branche pour gérer les tâches sans authentification.

## Branche `with-auth`

La branche `with-auth` inclut des fonctionnalités d'authentification. Elle ajoute les points de terminaison suivants :

- `/auths/register`
- `/auths/login`
- `/auths/profils`

Elle nécessite également une authentification pour les opérations CRUD sur les tâches.

Pour passer à la branche with-auth, utilisez :

```bash
git checkout with-auth
```

# Le modèle de données

1. Les données d'une tache

```typescript
class Task {
  // identifiant de la tache
  id?: number;
  // nom de la tache
  title: string;
  // description de la tache
  content: string;
  // priorité de la tache
  priority: string;
  // couleur de la tache
  color: string;
  // date de création de la tache
  createdAt: Date;
  // date de modification de la tache
  updatedAt: Date;
  // date de la tache
  dueDate: Date;
}
```

2. Les données à renseigner pour la création d'une tache

```typescript
class CreateTaskDto {
  // nom de la tache
  // requise
  title: string;
  // description de la tache
  // requise
  content: string;
  // priorité de la tache
  // requise
  priority: string;
  // couleur de la tache
  // requise
  color: string;
  // date de la tache
  // non requise
  dueDate: Date;
}
```

3. Les données à renseigner pour la mise à jour  d'une tache

```typescript
class UpdateTaskDto {
  // nom de la tache
  // non requise
  title: string;
  // description de la tache
  // non requise

# Déploiement et Sécurité

## Variables d'environnement critiques

Pour un déploiement sécurisé, assurez-vous de définir les variables d'environnement suivantes :

- `NODE_ENV`: 'production' pour l'environnement de production
- `JWT_SECRET`: Une chaîne complexe pour signer les tokens JWT
- `DB_STORAGE`: Chemin vers votre fichier SQLite en production
- `CORS_ALLOWED_ORIGINS`: Liste des domaines autorisés, séparés par des virgules
- `EMAIL_USER`: Adresse e-mail pour l'envoi de notifications
- `EMAIL_PASS`: Mot de passe application (non le mot de passe principal!)
- `GOOGLE_CLIENT_ID`: Identifiant client Google OAuth
- `GOOGLE_CLIENT_SECRET`: Secret client Google OAuth

## Bonnes pratiques de sécurité

1. **Ne jamais committer les fichiers .env**
2. **Toujours utiliser des secrets JWT complexes**
3. **Activer HTTPS en production**
4. **Restreindre les origines CORS en production**
5. **Utiliser des mots de passe d'application Gmail, pas des mots de passe de compte**

## Déploiement

Consultez le fichier DEPLOYMENT.md pour les instructions spécifiques à différentes plateformes cloud.