# Déployer BrandPilot sur Cloudflare (avec secrets)

> Guide écrit pour quelqu'un qui n'est pas développeur. Objectif : mettre l'app
> en ligne **et** stocker vos clés (`ANTHROPIC_API_KEY`, `BRIGHT_DATA_API_TOKEN`,
> `LINKUP_API_KEY`) **chiffrées côté Cloudflare**, jamais dans le code.

## 1. Le principe (important)

Un secret Cloudflare n'est lisible que par le **code qui tourne sur Cloudflare**.
Donc « stocker mes secrets sur Cloudflare » implique d'y **déployer l'app**. Les
clés restent invisibles dans le dashboard une fois posées, et n'apparaissent
jamais dans le dépôt public.

## 2. ⚠️ À lire avant de choisir Cloudflare (avis CTO)

BrandPilot lance **Bright Data** via un petit programme local (`npx @brightdata/mcp`,
un « sous-process »). **Cloudflare Workers n'autorise pas les sous-process.** Sur
Cloudflare, la recherche web du rédacteur **retombera donc sur les résultats
simulés** (mock) — l'app marche, mais sans le web réel de Bright Data. L'agent,
la boucle, les 3 angles, la Company Brain et l'Inspiration (Linkup passe par
HTTP) restent fonctionnels.

**Recommandation :**

| Vous voulez…                                   | Hébergement conseillé                          |
| ---------------------------------------------- | ---------------------------------------------- |
| Le **web réel Bright Data** partout            | Un hôte **Node** (Vercel / Fly / Render) + secrets de cet hôte |
| Déployer **sur Cloudflare** malgré ce compromis | Suivre ce guide (Bright Data → mock, le reste OK) |

Le reste de ce guide couvre la voie Cloudflare.

## 3. Installer les outils (une fois)

```bash
npm install --save-dev @opennextjs/cloudflare wrangler
```

Ajoutez ces scripts dans `package.json` (section `"scripts"`) :

```jsonc
"preview":   "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy":    "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
```

Les fichiers `wrangler.jsonc` et `open-next.config.ts` sont **déjà présents** à la
racine.

## 4. Se connecter + premier déploiement

```bash
npx wrangler login       # ouvre le navigateur pour autoriser (OAuth)
npm run deploy           # construit et déploie → crée le Worker "brandpilot"
```

## 5. Stocker les secrets (le cœur de votre demande)

Une fois le Worker créé, posez chaque secret (chiffré, invisible ensuite) :

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put BRIGHT_DATA_API_TOKEN
npx wrangler secret put LINKUP_API_KEY
```

Chaque commande demande la valeur **de façon interactive** (elle ne s'affiche pas
et n'est pas enregistrée dans l'historique). Puis redéployez pour être sûr :

```bash
npm run deploy
```

Vos secrets vivent maintenant côté Cloudflare. Le code les lit via `process.env.*`
exactement comme en local (le runtime `nodejs_compat` les expose ainsi).

> **Variante « Secrets Store » (secrets au niveau du compte).** Si vous voulez
> réutiliser une même clé sur plusieurs Workers, utilisez le Secrets Store :
> `npx wrangler secrets-store secret create <STORE_ID> --name LINKUP_API_KEY --scopes workers --remote`,
> puis liez-le au Worker. Pour un seul projet, les secrets par-Worker ci-dessus
> suffisent et sont plus simples — c'est la voie recommandée.

## 6. Après coup

- **Régénérez votre token Linkup** depuis votre dashboard Linkup (l'ancien a
  transité en clair lors de la mise en place). Reposez le nouveau avec
  `npx wrangler secret put LINKUP_API_KEY`.
- Les variables non-secrètes (`MODEL_PROVIDER`, `MAX_STEPS`, `REVISE_THRESHOLD`)
  peuvent aller dans `wrangler.jsonc` sous `"vars"` (ce ne sont pas des secrets).
- `.open-next/`, `.wrangler/` et `cloudflare-env.d.ts` sont déjà gitignorés.
