# Roadmap — audit Nuxt 4, standards et conventions

État de vérification : `npm run typecheck` et `npm run build` passent avec Nuxt 4.5.0.

## Déjà corrigé

- Les pages publiques chargent leurs données avec `useAsyncData` au lieu de `onMounted` + `$fetch`.
- Les pages privées utilisent le middleware `auth`.
- Le projet est en TypeScript et le typecheck passe.

## P0 — sécurité et intégrité

### 1. Rendre `JWT_SECRET` obligatoire

- [ ] Retirer le secret de secours codé en dur dans `server/utils/auth.ts`.
- [ ] Valider au démarrage que `JWT_SECRET` est présent et suffisamment robuste.
- [ ] Déclarer le secret dans `runtimeConfig`, sans l’exposer au client.
- [ ] Documenter sa génération dans `.env.example`.

Risque : une production sans variable d’environnement utilise aujourd’hui une clé JWT connue, ce qui permettrait de forger des sessions.

### 2. Migrer les sessions vers des cookies HttpOnly

- [ ] Ne plus stocker `auth_token` ni les données utilisateur dans `localStorage`.
- [ ] Créer et effacer le cookie de session uniquement depuis les endpoints serveur.
- [ ] Configurer le cookie avec `HttpOnly`, `Secure` en production et `SameSite=Lax` ou `Strict`.
- [ ] Prévoir une protection CSRF adaptée si les cookies deviennent le seul mécanisme d’authentification.

Risque : le token actuel est lisible depuis JavaScript ; une XSS suffit à voler une session.

### 3. Durcir entièrement les uploads

- [ ] Définir une taille maximale côté serveur avant de lire le fichier.
- [ ] Accepter une liste fermée de types vidéo et image.
- [ ] Vérifier le type réel du fichier (signature/MIME), pas seulement son extension.
- [ ] Remplacer les écritures synchrones par des I/O asynchrones ou du streaming.
- [ ] Valider les champs avant d’écrire le fichier et supprimer le fichier si la transaction échoue.
- [ ] Préparer un stockage objet pour la production (S3, R2, etc.).

Fichiers concernés : `server/api/videos/upload.post.ts`, `server/api/videos/[id].put.ts`.

### 4. Ajouter du rate limiting

- [ ] Limiter par IP les routes register, login et vérification/ré-envoi d’e-mail.
- [ ] Limiter par utilisateur les commentaires, likes, abonnements et notifications.
- [ ] Journaliser les dépassements et retourner des réponses `429` cohérentes.

## P1 — SSR, performance et comportement Nuxt

### 5. Faire charger les pages privées côté SSR

- [ ] Remplacer les chargements initiaux dans `onMounted` par `useFetch` ou `useAsyncData` au top-level.
- [ ] Commencer par `channel.vue`, `dashboard/videos.vue`, `my-comments.vue`, `settings.vue` et `video/edit/[id].vue`.
- [ ] Conserver `$fetch` pour les actions utilisateur (soumission, suppression, toggle), pas pour les données initiales.

Résultat attendu : pas de flash de chargement et HTML utile dès le rendu serveur.

### 6. Transmettre l’authentification lors des fetch SSR personnalisés

- [ ] Préférer `useFetch` sur les pages vidéo et profil lorsque la réponse dépend du visiteur connecté.
- [ ] Si `$fetch` reste nécessaire, transmettre explicitement le cookie de la requête SSR.
- [ ] Vérifier qu’il n’y a pas de désynchronisation entre rendu serveur et hydratation cliente.

### 7. Remplacer les redirections côté client

- [ ] Remplacer la redirection `onMounted` de `pages/channel/[id].vue` par une redirection de route ou un middleware.

Résultat attendu : aucune page intermédiaire ni flash visuel.

### 8. Ajouter pagination et limites de réponse

- [ ] Paginer vidéos, commentaires, résultats de recherche, abonnements et notifications.
- [ ] Ajouter des limites, curseurs ou offsets validés côté API.
- [ ] Ajouter les index base de données associés aux tris et filtres fréquents.

## P2 — conventions et maintenabilité

### 9. Outillage qualité et CI

- [ ] Ajouter ESLint avec les règles Vue/Nuxt/TypeScript.
- [ ] Ajouter Prettier ou une convention de formatage unique, y compris les fins de ligne.
- [ ] Ajouter Vitest pour les utilitaires et routes API.
- [ ] Ajouter Playwright pour les parcours register, login, vérification e-mail et upload.
- [ ] Exécuter `typecheck`, lint, tests et build dans la CI.

### 10. Nettoyer les conventions Nuxt et TypeScript

- [ ] Retirer les imports explicites `useRoute` et `useRouter` depuis `vue-router` ; utiliser les auto-imports Nuxt.
- [ ] Remplacer le `any[]` restant dans `server/api/videos/[id]/comments.get.ts` par un type partagé.
- [ ] Déplacer `@types/nodemailer` vers `devDependencies`.
- [ ] Évaluer la suppression de dépendances directes inutiles à Nuxt, notamment `@nuxt/kit` et `vue-router` si elles ne servent pas hors du runtime Nuxt.
- [ ] Activer les Nuxt DevTools uniquement en développement.
- [ ] Supprimer les lignes blanches finales signalées dans `pages/upload.vue` et `pages/video/edit/[id].vue`.

### 11. SEO, documentation et exploitation

- [ ] Définir `useSeoMeta` sur les pages vidéo, chaîne, profil et recherche.
- [ ] Ajouter une page d’erreur applicative (`app/error.vue`) et une stratégie cohérente de remontée des erreurs API.
- [ ] Compléter le README : prérequis, variables d’environnement, migrations Drizzle, lancement local, build et déploiement.
- [ ] Remplacer SQLite et le disque local par des services persistants avant un déploiement multi-instance ou serverless.

## Références Nuxt

- [Structure de projet Nuxt](https://nuxt.com/docs/4.x/directory-structure)
- [Chargement des données](https://nuxt.com/docs/4.x/getting-started/data-fetching)
- [Middleware de route](https://nuxt.com/docs/4.x/guide/directory-structure/app/middleware)
- [Auto-imports](https://nuxt.com/docs/4.x/guide/concepts/auto-imports)
- [Runtime config](https://nuxt.com/docs/4.x/guide/going-further/runtime-config)
