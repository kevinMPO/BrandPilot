# CLAUDE.md — Comprendre Content Agent

> Ce fichier est écrit pour quelqu'un qui **n'est pas développeur**. Il explique,
> en français et simplement, ce que fait l'app, comment elle est organisée, et
> où vit chaque morceau de code. (Il sert aussi de mémoire pour les assistants IA
> qui travailleront sur le projet.)

## En 3 phrases

Content Agent prend un **sujet** (ex : « l'IA agentique en entreprise ») et un
**vrai agent IA** réfléchit, va chercher des informations sur le web, puis en
tire **3 angles de post LinkedIn** prêts à publier. Pendant qu'il travaille, on
voit son raisonnement se construire **en direct**, sous forme d'un **graphe de
nœuds animé**. L'agent n'est pas un script figé : il décide lui-même quand
chercher, quand recommencer une recherche, et quand s'arrêter.

## La boucle ReAct, expliquée simplement

« ReAct » = **Reason + Act** (Raisonner + Agir). C'est une façon de faire
travailler un modèle de langage par petites étapes, en boucle :

```
        ┌─────────────────────────────────────────────┐
        │                                             ▼
   1. RAISONNE   →   2. AGIT (cherche)   →   3. OBSERVE (résultats)
   « que me      │   « je lance une       │   « voici 4 sources, »
     manque-t-il?»│     recherche web »    │     que m'apprennent-elles?»
        ▲         └────────────────────────┘            │
        │   « il me manque un angle, je recommence »     │
        └────────────────────────────────────────────────┘
                              │  (quand l'agent a assez de matière)
                              ▼
                    4. PUBLIE 3 ANGLES  →  fin
```

- L'agent **raisonne** (nœud violet), décide de **chercher** (nœud bleu),
  **observe** les résultats (nœud gris), puis recommence s'il le faut.
- Quand il reboucle, une **arête revient vers un nœud de raisonnement** : c'est
  la boucle, rendue visible à l'écran (arête orange « ↺ re-recherche »).
- Une **limite dure** (`MAX_STEPS`, 6 par défaut) empêche l'agent de tourner à
  l'infini.
- Il termine en produisant **3 angles** (nœuds roses), chacun adossé à au moins
  une **source réelle**.

Le « harnais » qui exécute cette boucle est **Mastra** : c'est lui qui rappelle
le modèle à chaque tour et exécute les outils que le modèle décide d'utiliser.

## Ça marche sans payer ? Oui.

L'app est conçue pour tourner **sans aucune clé payante** :

| Élément        | Avec clé                                   | Sans clé (par défaut)                          |
| -------------- | ------------------------------------------ | ---------------------------------------------- |
| Le modèle IA   | Le **vrai agent Mastra** tourne            | Un **agent de démonstration** simule la boucle |
| La recherche web | **Bright Data** (web réel) via MCP       | Des **résultats simulés** réalistes            |

Dans les deux cas, **le graphe se construit, la boucle est visible, et 3 angles
s'affichent**. Ajouter une clé fait passer du simulé au réel **sans changer une
ligne de code**.

## Comment changer de modèle

Une seule variable : `MODEL_PROVIDER`, au format `fournisseur/modèle`.

```bash
MODEL_PROVIDER=anthropic/claude-opus-4-8   # défaut
MODEL_PROVIDER=openai/gpt-5.5
MODEL_PROVIDER=mistral/mistral-large
```

Le code ne connaît aucun fournisseur en dur : il lit cette variable et construit
le bon modèle (voir `src/mastra/lib/models.ts`). Changer de modèle = changer
cette ligne dans `.env.local`, rien d'autre.

## Commandes

```bash
npm install       # installer les dépendances (une fois)
npm run dev       # lancer en local sur http://localhost:3000
npm run build     # construire la version de production
npm run start     # démarrer la version de production
npm run lint      # vérifier le style du code
npm run typecheck # vérifier les types TypeScript
npm run evals     # lancer les évaluations (hors ligne, sur cassettes figées)
```

## Les variables d'environnement (et à quoi elles servent)

Copier `.env.example` vers `.env.local`, puis remplir au besoin.

| Variable                | Rôle                                                                                       | Obligatoire ?                          |
| ----------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| `MODEL_PROVIDER`        | Quel modèle pilote l'agent (`fournisseur/modèle`).                                          | Non (défaut : `anthropic/claude-opus-4-8`) |
| `ANTHROPIC_API_KEY`     | Clé pour utiliser les modèles Anthropic (Claude).                                          | Seulement si `MODEL_PROVIDER=anthropic/...` |
| `OPENAI_API_KEY`        | Clé pour les modèles OpenAI.                                                                | Seulement si `MODEL_PROVIDER=openai/...`    |
| `MISTRAL_API_KEY`       | Clé pour les modèles Mistral.                                                               | Seulement si `MODEL_PROVIDER=mistral/...`   |
| `BRIGHT_DATA_API_TOKEN` | Active la **vraie** recherche web via Bright Data. Absente → résultats simulés.            | Non (mock sinon)                       |
| `MAX_STEPS`             | Nombre maximum de tours de boucle de l'agent (garde-fou anti-boucle infinie).              | Non (défaut : 6)                       |
| `CRITIC_MODEL_PROVIDER` | Modèle de l'agent **critique** (`fournisseur/modèle`), pour un regard indépendant.         | Non (défaut : un modèle Anthropic différent du rédacteur) |
| `REVISE_THRESHOLD`      | Note critique (/100) sous laquelle un angle est réécrit (boucle critique → révision).      | Non (défaut : 75)                      |
| `MEMORY_PATH`           | Chemin du fichier mémoire (non-répétition entre runs).                                      | Non (défaut : `.mastra/memory.json`)   |

> Si **aucune** clé de modèle n'est renseignée, l'app utilise l'agent de
> démonstration. C'est voulu : la démo marche immédiatement.

## Carte des fichiers clés (quoi vit où, et pourquoi)

```
src/
├─ mastra/                         ← tout ce qui concerne les AGENTS
│  ├─ index.ts                     ← l'instance Mastra (enregistre l'agent)
│  ├─ agents/
│  │  ├─ contentAgent.ts           ← le RÉDACTEUR : INSTRUCTIONS + voix, son modèle, ses outils
│  │  ├─ criticAgent.ts            ← le CRITIQUE : note les 3 angles (modèle différent du rédacteur)
│  │  └─ reviserAgent.ts           ← le RÉVISEUR : réécrit un angle faible ou non sourcé
│  ├─ tools/
│  │  ├─ brightDataSearch.ts       ← outil de recherche web : RÉEL (Bright Data MCP) OU mock
│  │  └─ publishAngles.ts          ← outil « j'ai fini » : l'agent l'appelle pour livrer 3 angles
│  ├─ voice/                       ← FEW-SHOT : voix de l'auteur ≠ structure
│  │  ├─ voice-corpus.ts           ← exemplaires annotés + VOICE_TRAITS + ANTI_VOICE (interdits)
│  │  ├─ structure-pattern.ts      ← gabarit de mise en forme neutre (sans la voix)
│  │  └─ index.ts                  ← buildVoiceGuidance() injecté dans rédacteur + réviseur
│  ├─ memory/                      ← MÉMOIRE (non-répétition + boucle fermée)
│  │  ├─ memoryStore.ts            ← persiste {sujet, hooks, thèmes, date} ; rappel avant un run
│  │  └─ engagementStore.ts        ← stub d'interface pour l'engagement réel (TODO Apify)
│  └─ lib/
│     ├─ schemas.ts                ← contrat de données partagé (Zod) : requête + événements
│     ├─ models.ts                 ← choisit le modèle (MODEL_PROVIDER / CRITIC_MODEL_PROVIDER)
│     ├─ events.ts                 ← transforme la vie de l'agent en nœuds/arêtes (topologie)
│     ├─ runAgent.ts               ← orchestre : rédacteur → critique + ancrage → révision
│     ├─ sourceRegistry.ts         ← capture chaque extrait ramené (base de preuves)
│     ├─ verifyClaims.ts           ← vérifie que chaque fait est soutenu par une source réelle
│     └─ mockAgent.ts              ← l'agent de démonstration (boucle simulée, sans clé)
│
├─ app/
│  ├─ layout.tsx                   ← coquille HTML, polices, thème sombre, toasts
│  ├─ page.tsx                     ← l'écran principal : barre + canvas + résultats + déroulé
│  ├─ globals.css                  ← les TOKENS de design (couleurs, ombres, dégradés)
│  └─ api/agent/stream/route.ts    ← le serveur SSE : lance l'agent, envoie un événement par tour
│
├─ components/
│  ├─ QueryBar.tsx                 ← saisie du sujet + bouton Lancer + états
│  ├─ ResultPanel.tsx              ← les 3 angles finaux, avec « Copier le post »
│  ├─ RunTimeline.tsx              ← barre latérale : étapes + compteur de tokens/latence
│  ├─ theme-provider.tsx / theme-toggle.tsx ← gestion du thème clair/sombre
│  ├─ ui/                          ← briques d'interface réutilisables (boutons, cartes…)
│  └─ graph/                       ← TOUT le graphe React Flow
│     ├─ AgentCanvas.tsx           ← le canvas : assemble nœuds/arêtes, layout, zoom auto
│     ├─ build.ts                  ← convertit la liste d'événements en nœuds + arêtes
│     ├─ layout.ts                 ← positionne les nœuds automatiquement (dagre, gauche→droite)
│     ├─ types.ts                  ← types des nœuds et arêtes
│     ├─ EmptyCanvas.tsx           ← écran vide illustré + squelette de chargement
│     ├─ NodeDetail.tsx            ← panneau détail au clic sur un nœud
│     ├─ nodes/                    ← 6 types de nœuds : mémoire, raisonnement, action,
│     │                              observation, angle, ancrage (vérification)
│     └─ edges/GradientEdge.tsx    ← l'arête à dégradé animé (et la boucle orange)
│
├─ hooks/
│  └─ useAgentStream.ts            ← côté navigateur : lit le flux SSE et valide chaque événement
│
└─ (racine) evals/                 ← ÉVALS hors ligne (npm run evals)
   ├─ subjects.mjs                 ← jeu de sujets représentatifs
   ├─ scorers.mjs                  ← 4 scorers (différenciation, ancrage, hook, voix)
   ├─ fixtures.mjs                 ← cassettes figées + labels humains (reproductible)
   └─ run.mjs                      ← calcule les scores + écart aux labels → report.json
```

> **Pipeline complet d'un run** : mémoire (rappel) → boucle ReAct du rédacteur
> (raisonnement streamé + recherches) → `publishAngles` → **critique** (autre
> modèle) + **ancrage des faits** → **révision** des angles faibles/non sourcés →
> ré-notation → 3 angles. Chaque étape émet un event SSE typé = un nœud du graphe.

## Le flux de données (le cœur), en une image

```
QueryBar  ──POST(sujet)──►  /api/agent/stream  ──lance──►  runAgentStream
                                                              │
                                       (vrai agent Mastra OU agent démo)
                                                              │ un événement par tour
   AgentCanvas  ◄──SSE (reasoning|action|observation|angle|final|error)──┘
        │
        └─ crée un nœud par événement, le relie au précédent, relance le layout,
           anime le nœud actif (halo pulsé). Les 3 angles finaux vont dans ResultPanel.
```

Chaque événement est **typé et validé** (Zod) des deux côtés (`schemas.ts`), donc
le serveur et l'interface ne peuvent pas se désynchroniser.

## Décisions d'architecture (le « pourquoi »)

- **Un outil `publishAngles` pour finir.** L'agent décide lui-même de s'arrêter
  en appelant cet outil avec 3 angles. C'est plus « agentique » que de parser du
  texte libre, et ça garantit une sortie structurée.
- **La topologie du graphe est décidée côté serveur** (`events.ts`). L'interface
  reste « bête » : elle dessine ce qu'on lui dit. La boucle est donc fiable.
- **L'agent de démonstration** existe pour que la démo soit bluffante **sans clé**.
  Il passe par le même « émetteur » d'événements que le vrai agent : visuellement,
  c'est identique.
- **Le contenu ramené par les outils est traité comme une DONNÉE, jamais comme
  des instructions** (délimité dans le prompt). C'est la première défense contre
  l'« injection de prompt ».
- **Streaming via SSE en runtime Node.js** (pas « edge ») car Mastra et le client
  MCP ont besoin des API de Node.

## Limites connues & prochaines étapes (jalons)

Le code prévoit déjà les **points de branchement** pour la suite (sans refonte) :

- **Apify** : ajouter une fonction de recherche au même format que
  `brightDataSearch` et brancher selon une variable d'env.
- **Mémoire** : `src/mastra/index.ts` accepte une option `memory` / `storage`.
- **Second agent « critique »** : enregistrer un `criticAgent` à côté du premier
  dans `index.ts` pour relire/scorer les angles.
- **Évaluations (evals)** : Mastra fournit des métriques ; on pourra scorer la
  qualité des angles automatiquement.

Limites actuelles : pas de persistance (chaque run repart de zéro), le parsing des
résultats Bright Data réels est « best-effort » (le format SERP varie), et le
compteur de tokens n'est rempli que sur le chemin du vrai agent.
