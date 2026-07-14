# Content Agent

Un **vrai agent IA** (Mastra) génère des **angles de posts LinkedIn** à partir
d'un sujet, en allant chercher du **contexte web réel**, et affiche son
**raisonnement en direct** sous forme d'un **graphe de nœuds animé** (React Flow).

Ce n'est pas un pipeline scripté : l'agent suit une **boucle ReAct** (Reason →
Act → Observe) et décide lui-même quand chercher, quand reboucler et quand
s'arrêter. Le runtime **Mastra** exécute cette boucle.

> 🎯 **Marche sans aucune clé payante.** Sans clé, un agent de démonstration
> simule la boucle et la recherche web renvoie des résultats réalistes. Ajoutez
> des clés pour passer au réel — **sans changer une ligne de code**.

![ReAct loop](https://img.shields.io/badge/loop-ReAct-8b5cf6) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Mastra](https://img.shields.io/badge/agent-Mastra-ff5c8a)

## Stack

- **Next.js 14** (App Router) · **TypeScript strict** · Node 20
- **Mastra** (`@mastra/core`, `@mastra/mcp`) — runtime de l'agent ReAct
- **Routing modèle agnostique** via `MODEL_PROVIDER` (Anthropic / OpenAI / Mistral)
- **Bright Data** via MCP pour la recherche web (mock si pas de token)
- **React Flow v12** (`@xyflow/react`) + **dagre** pour l'auto-layout
- **Tailwind CSS** + **shadcn/ui** (Radix) · **Framer Motion** · **Sonner** · **Lucide** · **next-themes**
- **SSE** (Server-Sent Events) pour le streaming live, runtime Node.js

## Fonctionnalités

- 🔁 **Vrai agent ReAct** : raisonne, cherche le web (Bright Data), reboucle, décide quand s'arrêter — raisonnement **streamé en direct** (1ʳᵉ personne).
- 👥 **Multi-agents** : un **rédacteur**, un **critique** (sur un modèle *différent* pour un regard indépendant) et un **réviseur** qui réécrit les angles faibles (boucle critique → révision).
- 🛡️ **Ancrage des faits vérifié mécaniquement** : chaque affirmation factuelle est confrontée aux extraits réellement ramenés ; sinon → révision, jamais d'invention.
- 🗣️ **Voix few-shot** : corpus annoté (voix) séparé du gabarit (structure), avec interdits durs anti-« bait ».
- 🧠 **Mémoire** : non-répétition entre runs (rappel des thèmes déjà couverts) ; archi prête pour la boucle d'engagement.
- 📊 **Évals hors ligne** (`npm run evals`) : 4 scorers calibrés sur des cassettes figées + labels humains, reproductibles, avec gate de seuils.
- 🎨 **Graphe live** : nœuds mémoire / raisonnement / action / observation / angle / ancrage, codés par couleur, détail au clic.

## Démarrage rapide (local)

Prérequis : **Node.js 20+**.

```bash
# 1. Installer les dépendances
npm install

# 2. (Optionnel) configurer l'environnement
cp .env.example .env.local
#   — laissez tout vide pour la démo sans clé
#   — ou renseignez une clé de modèle (et MODEL_PROVIDER) pour le vrai agent
#   — ajoutez BRIGHT_DATA_API_TOKEN pour la vraie recherche web

# 3. Lancer
npm run dev
```

Ouvrez http://localhost:3000, tapez un sujet, cliquez **Lancer l'agent** :
le graphe se construit nœud par nœud, la boucle de re-recherche est visible,
puis **3 angles** s'affichent — chacun copiable en un clic.

## Configuration

Toutes les variables sont documentées dans [`.env.example`](./.env.example) et,
plus en détail, dans [`CLAUDE.md`](./CLAUDE.md).

| Variable                | Rôle                                                        | Défaut                      |
| ----------------------- | ----------------------------------------------------------- | --------------------------- |
| `MODEL_PROVIDER`        | Modèle de l'agent, format `fournisseur/modèle`              | `anthropic/claude-opus-4-8` |
| `ANTHROPIC_API_KEY`     | Clé Anthropic (si provider = anthropic)                     | —                           |
| `OPENAI_API_KEY`        | Clé OpenAI (si provider = openai)                           | —                           |
| `MISTRAL_API_KEY`       | Clé Mistral (si provider = mistral)                         | —                           |
| `BRIGHT_DATA_API_TOKEN` | Active la vraie recherche web (sinon mock)                  | —                           |
| `MAX_STEPS`             | Garde-fou : nombre max de tours de boucle                   | `6`                         |
| `CRITIC_MODEL_PROVIDER` | Modèle de l'agent critique (regard indépendant)             | Anthropic ≠ rédacteur       |
| `REVISE_THRESHOLD`      | Note /100 sous laquelle un angle est réécrit                | `75`                        |
| `MEMORY_PATH`           | Fichier mémoire (non-répétition entre runs)                 | `.mastra/memory.json`       |

**Changer de modèle** : modifiez juste `MODEL_PROVIDER`.

```bash
MODEL_PROVIDER=openai/gpt-5.5
MODEL_PROVIDER=mistral/mistral-large
```

## Scripts

```bash
npm run dev        # développement (http://localhost:3000)
npm run build      # build de production
npm run start      # serveur de production
npm run lint       # ESLint
npm run typecheck  # vérification des types
npm run evals      # évaluations hors ligne (cassettes figées) → evals/report.json
```

## Deploy to Vercel

1. Poussez ce dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com) → **New Project** → importez le dépôt.
3. Dans **Settings → Environment Variables**, ajoutez celles dont vous avez
   besoin (cf. tableau ci-dessus). Pour une démo, **aucune n'est obligatoire**.
4. **Deploy**.

Le fichier [`vercel.json`](./vercel.json) configure déjà :

- les **en-têtes de sécurité** (CSP, HSTS, X-Frame-Options, etc.) ;
- un **`maxDuration`** adapté à la route SSE (l'agent peut mettre plusieurs
  secondes à boucler).

> La route `/api/agent/stream` tourne sur le **runtime Node.js** (pas Edge), car
> Mastra et le client MCP utilisent des API Node.

## Comment ça marche

Voir [`CLAUDE.md`](./CLAUDE.md) pour l'explication pédagogique complète (boucle
ReAct, carte des fichiers, flux de données, points d'extension). En résumé :

```
QueryBar ─POST(sujet)→ /api/agent/stream ─→ agent (Mastra réel OU démo)
                                              │  un événement SSE par tour
   AgentCanvas ◄─ reasoning | action | observation | angle | final | error
        └─ un nœud par événement, relié au précédent, layout dagre, animation live
```

## Sécurité

- Les clés (LLM, Bright Data) sont lues **uniquement** depuis l'environnement,
  jamais codées en dur.
- Le contenu ramené par les outils est traité comme de la **donnée**, jamais
  comme des instructions (délimitation dans le prompt — défense anti
  prompt-injection).
- En-têtes de sécurité fournis via `vercel.json`.

## Licence

MIT — faites-en bon usage.
