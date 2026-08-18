# Creative Currencies Africa API

Backend NestJS pour la plateforme Creative Currencies Africa.

## Stack

- NestJS
- Prisma 7
- PostgreSQL local, géré avec PGAdmin si souhaité

## Démarrage local sans Docker

1. Créer une base PostgreSQL nommée `creative_currencies` dans PGAdmin.
2. Copier `apps/backend/.env.example` vers `apps/backend/.env`.
3. Ajuster `DATABASE_URL` selon votre utilisateur PostgreSQL local.
4. Générer le client Prisma :

```bash
npm --workspace apps/backend run prisma:generate
```

5. Créer la première migration :

```bash
npm --workspace apps/backend run prisma:migrate -- --name init
```

6. Démarrer l’API :

```bash
npm run dev:backend
```

L’API répond ensuite sur `http://localhost:4000/api/health`.
La documentation Swagger est disponible sur `http://localhost:4000/api/docs`.

## Modules métier préparés

- Authentification et types de compte
- Creative ID et portfolio
- Formations, modules et inscriptions
- Ressources pédagogiques
- Opportunités et candidatures
- Agenda et inscriptions aux événements
- Certificats et badges
- Notifications
- Partenaires et futur back-office
