# Déployer BrandPilot sur Vercel

> Guide pas-à-pas pour quelqu'un qui n'est pas développeur. À la fin, votre app
> est en ligne, avec vos clés stockées **côté Vercel** (jamais dans le code).
> Build de production déjà vérifié en local (`npm run build` ✅).

## Pourquoi Vercel

Vercel est l'hébergeur **natif de Next.js** (le framework de BrandPilot). Tout ce
qui marche en local marche en ligne, **sans configuration** : l'agent Mastra, la
recherche Bright Data + Linkup (MCP en HTTP), le streaming en direct (SSE).

## 1. Le code est déjà prêt

- Poussé sur GitHub : `github.com/kevinMPO/BrandPilot` ✅
- `vercel.json` gère déjà les **en-têtes de sécurité** (CSP, HSTS…) et le
  **`maxDuration`** des routes qui streament (l'agent peut boucler plusieurs
  secondes).

## 2. Importer le projet (2 minutes)

1. Allez sur **[vercel.com](https://vercel.com)** → connectez-vous avec GitHub.
2. **Add New… → Project**.
3. Importez le dépôt **`BrandPilot`**.
4. Vercel détecte **Next.js** tout seul — ne touchez pas aux réglages de build.

## 3. Renseigner les variables d'environnement

Dans l'écran d'import (ou plus tard dans **Settings → Environment Variables**),
ajoutez ce dont vous avez besoin. **Pour une démo, aucune n'est obligatoire**
(l'app bascule sur des simulations réalistes).

| Variable | Valeur | Utilité |
| --- | --- | --- |
| `MODEL_PROVIDER` | `anthropic/claude-opus-4-8` | Quel modèle pilote l'agent |
| `ANTHROPIC_API_KEY` | votre clé Anthropic | Le vrai agent (sinon démo) |
| `BRIGHT_DATA_API_TOKEN` | votre token Bright Data | Recherche web réelle + Company Brain |
| `LINKUP_API_KEY` | votre clé Linkup | Recherche réelle pour l'Inspiration |

> 🔑 Copiez les valeurs depuis votre `.env.local`. **Pensez à régénérer votre
> token Linkup** (il a transité en clair lors de la mise en place) avant de le
> coller ici.

## 4. Déployer

Cliquez **Deploy**. Après ~1 minute, vous obtenez une URL
`https://brandpilot-….vercel.app`. La landing est sur `/`, l'agent sur `/app`.

## 5. (Optionnel) Cloudflare devant

Vous aimez Cloudflare ? Gardez-le **devant** Vercel pour le **DNS / CDN** :
pointez votre domaine Cloudflare vers l'URL Vercel (CNAME) et activez le proxy.
Vous cumulez la simplicité de Vercel et le réseau Cloudflare.

## Mettre à jour

Chaque `git push` sur `main` **redéploie automatiquement**. Rien d'autre à faire.
