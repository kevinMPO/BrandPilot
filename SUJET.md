# SUJET.md — Les principes d'un vrai agent (+ audit de Content Agent)

> Un **principe** te dit quoi faire ; une définition se contente de décrire.
> Cette page fige les règles qui séparent un **vrai agent** d'un simple wrapper,
> et **audite l'état réel** de ce projet face à chacune.
>
> **La boussole, en 3 verbes : un vrai agent _décide_, _boucle_, et _se vérifie_.**
> Tout le reste sert ces trois verbes.
>
> Légende : ✅ respecté · 🟡 partiel · ❌ à faire

---

## 1. Le moteur — la boucle et qui tient le volant

- [x] ✅ **Le modèle décide, le harnais fait.**
  Le LLM raisonne et émet des intentions ; Mastra exécute les outils.
  → `agent.stream()` dans [runAgent.ts](src/mastra/lib/runAgent.ts) ; on **lit** le flux, on ne réécrit pas l'exécution.

- [x] ✅ **La boucle ReAct est le cœur** (raisonner → agir → observer → re-raisonner).
  → Vraie boucle, le modèle relance des recherches (3-5 selon les runs), pas une passe unique.

- [x] ✅ **Borne toujours l'autonomie** (limite dure + condition d'arrêt explicite).
  → `MAX_STEPS` (6) + arrêt quand le modèle appelle `publishAngles` ([publishAngles.ts](src/mastra/tools/publishAngles.ts)).

- [x] ✅ **Ne sur-agentifie pas** (déterministe partout, autonome là où ça paie).
  → Pipeline contrôlé avec **une** vraie étape agentique (la boucle de recherche) + une étape critique. Pas d'agent en roue libre.

## 2. Le contexte — ce que tu donnes au modèle

- [x] ✅ **Montre, ne décris pas (few-shot).**
  → Corpus de voix annoté ([voice-corpus.ts](src/mastra/voice/voice-corpus.ts)) + gabarit de structure séparé ([structure-pattern.ts](src/mastra/voice/structure-pattern.ts)), injectés dans le rédacteur ET le réviseur via [buildVoiceGuidance()](src/mastra/voice/index.ts). `VOICE_TRAITS` + `ANTI_VOICE` (interdits durs) + garde-fou anti-citation inventée.

- [ ] 🟡 **Le bon contexte au bon moment.**
  → On délimite le sujet et on réinjecte les résultats d'outils, mais le contexte **grossit** sans élagage à chaque tour. À surveiller quand on ajoutera mémoire/scraping.

- [x] ✅ **Le résultat d'un outil est de la donnée, jamais une instruction.**
  → Sujet délimité `<sujet>…</sujet>` + consigne explicite anti-injection dans le prompt système ([contentAgent.ts](src/mastra/agents/contentAgent.ts)). 1ʳᵉ couche de défense en place.

## 3. La rigueur — empêcher l'agent de mentir et de se complaire

- [x] ✅ **Ancre chaque fait dans une source (anti-hallucination), vérifié MÉCANIQUEMENT.**
  → [sourceRegistry.ts](src/mastra/lib/sourceRegistry.ts) capture chaque extrait ramené ; [verifyClaims.ts](src/mastra/lib/verifyClaims.ts) (sur le CRITIC_MODEL) extrait les affirmations factuelles et vérifie que chacune est corroborée par un extrait réel (sinon `supported=false`). Un angle non ancré est renvoyé au réviseur avec le motif « affirmation non sourcée ». Nœud graphe **« Ancrage ✓/✗ »** par angle.

- [x] ✅ **Fais-le se critiquer sans ego** (rédacteur propose, critique démolit, et **on agit dessus**).
  → Agent critique distinct ([criticAgent.ts](src/mastra/agents/criticAgent.ts)) qui note /100 + verdict, **PLUS** une boucle critique → révision : tout angle < `REVISE_THRESHOLD` (75) est réécrit par le rédacteur ([reviserAgent.ts](src/mastra/agents/reviserAgent.ts)) avec le verdict + les sources réelles, puis re-noté. Visible dans le graphe (tag « révisé ✦», score qui monte).

- [x] ✅ **Diversifie les modèles pour la critique** (anti auto-préférence).
  → `CRITIC_MODEL_PROVIDER` ([models.ts](src/mastra/lib/models.ts) `resolveCriticModel()`). Par défaut, le critique tourne sur un modèle Anthropic **différent** du rédacteur (sonnet→haiku).

- [x] ✅ **Évalue systématiquement** (scorers calibrés, reproductibles).
  → [evals/](evals/) : dataset de sujets, 4 scorers règles-d'abord (differentiation, sourceGrounded, hookStrength, voiceAlignment), cassettes figées + labels humains, `npm run evals` hors ligne → `report.json` + écart aux labels, et un **gate de seuils** (exit 1) prêt pour la CI (sans GitHub pour l'instant).

## 4. Le système — ce qui le rend durable

- [ ] 🟡 **Ferme la boucle** (réinjecter l'engagement réel du post publié).
  → Archi prête : [engagementStore.ts](src/mastra/memory/engagementStore.ts) expose l'interface (stub + TODO Apify). Reste à brancher le scraping (jalon ultérieur).

- [x] ✅ **Donne-lui une mémoire** (cohérence, non-répétition).
  → [memoryStore.ts](src/mastra/memory/memoryStore.ts) persiste {sujet, hooks, thèmes, date} ; rappel AVANT le run (nœud graphe **« Mémoire »** en amont) passé au rédacteur comme contrainte « évite ces angles ». Lecture cheap, écriture après le run → **aucune latence ajoutée**.

- [ ] 🟡 **Gouverne comme du code** (prompts versionnés, secrets, evals en CI, réponses d'outils figées pour les tests).
  → ✅ secrets en env (`.env.local` git-ignoré, jamais en dur). 🟡 prompts dans le code (versionnés via Git mais pas isolés). ❌ pas d'evals CI, ❌ pas de fixtures d'outils figées (le web change → tests non reproductibles).

- [x] ✅ **Rends le raisonnement observable.**
  → Le graphe React Flow trace **chaque tour** en direct (debug **et** démo). Télémétrie Mastra activable en bonus.

---

## Score de la boussole

| Verbe | État | Détail |
|---|---|---|
| **Décide** | ✅ | choisit ses requêtes, le nombre de recherches, quand s'arrêter |
| **Boucle** | ✅ | ReAct réelle et bornée |
| **Se vérifie** | 🟢 | critique multi-modèle ✅ + boucle de révision ✅ — reste : sourçage vérifié mécaniquement, evals calibrés |

➡️ **Décide ✅, boucle ✅, se vérifie 🟢 — il ne manque que la mesure (evals) et l'ancrage strict des faits.**

## Prochains jalons (ordre conseillé)

1. ~~**Critique sur un autre modèle**~~ ✅ FAIT (`CRITIC_MODEL_PROVIDER`).
2. ~~**Boucle critique → révision**~~ ✅ FAIT (`REVISE_THRESHOLD`, réécriture + re-notation).
3. ~~**Few-shot** — voix + structure séparées, annotées~~ ✅ FAIT ([src/mastra/voice/](src/mastra/voice/)).
4. ~~**Ancrage des faits vérifié**~~ ✅ FAIT ([verifyClaims.ts](src/mastra/lib/verifyClaims.ts) + nœud « Ancrage »).
5. **Harnais d'evals** + base de vérité notée à la main, branché en CI.
6. **Mémoire** (voix de l'utilisateur) puis **boucle fermée** (engagement réel réinjecté).
