# Guide de déploiement

## Déploiement sur Heroku

1. Créez un compte Heroku
2. Installez Heroku CLI
3. Connectez-vous via la commande : `heroku login`
4. Créez une nouvelle application : `heroku create votre-nom-app`
5. Définissez les variables d'environnement :
   ```
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=votre_secret_jwt_complexe
   heroku config:set EMAIL_USER=votre_email@gmail.com
   heroku config:set EMAIL_PASS=votre_mot_de_passe_application
   heroku config:set DB_STORAGE=./.db/production.sqlite3
   heroku config:set CORS_ALLOWED_ORIGINS=https://votre-domaine.fr,https://votre-autre-domaine.com
   ```
6. Déployez avec : `git push heroku main`

## Déploiement sur Railway

1. Créez un compte Railway
2. Connectez-vous via la commande : `railway login`
3. Link votre projet : `railway link`
4. Définissez les variables d'environnement dans l'interface web ou avec `railway up`
5. Déployez avec : `railway up`

## Variables d'environnement requises

- `NODE_ENV` : 'development' ou 'production'
- `JWT_SECRET` : Chaîne secrète complexe pour signer les tokens JWT
- `EMAIL_USER` : Adresse email pour l'envoi de mails
- `EMAIL_PASS` : Mot de passe application (pas le mot de passe du compte)
- `DB_STORAGE` : Chemin vers le fichier de base de données SQLite
- `CORS_ALLOWED_ORIGINS` : Liste des origines autorisées séparées par des virgules

## Commandes utiles

- Migration de la base de données : `npx sequelize-cli db:migrate`
- Lancement de l'application : `npm run start:prod`

## Sécurité

- Ne jamais commiter les fichiers .env
- Utiliser des secrets complexes
- Ne jamais exposer les tokens JWT ou les identifiants de base de données
- Valider toutes les entrées utilisateur