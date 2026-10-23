# Mettre en place une veille RSS gratuite avec Telegram et GitHub

Ce tutoriel explique comment créer une veille automatisée, sans serveur payant et sans exposer de données sensibles.

La solution utilise :

- GitHub pour stocker le code et la configuration publique ;
- GitHub Pages pour publier l’interface ;
- GitHub Actions pour exécuter la veille automatiquement ;
- Telegram pour recevoir les alertes ;
- des flux RSS pour récupérer les actualités.

## 1. Préparer le dépôt GitHub

Créer un dépôt GitHub public, par exemple :

```text
veille-gratuite
```

Déposer dans le dépôt les fichiers suivants :

```text
index.html
worker.mjs
package.json
config/config.json
data/seen.json
.github/workflows/pages.yml
.github/workflows/veille.yml
```

Le dépôt peut être public, mais il ne doit jamais contenir de token, mot de passe ou clé privée.

## 2. Configurer les flux RSS et les mots-clés

Ouvrir le fichier :

```text
config/config.json
```

Exemple de configuration sans donnée sensible :

```json
{
  "keywords": [
    "accessibilité numérique",
    "RGAA",
    "WCAG",
    "Vue.js",
    "Vuetify",
    "TypeScript",
    "intelligence artificielle",
    "cybersécurité"
  ],
  "feeds": [
    {
      "name": "OpenAI News",
      "url": "https://openai.com/news/rss.xml"
    },
    {
      "name": "Vue.js Blog",
      "url": "https://blog.vuejs.org/feed.rss"
    },
    {
      "name": "MDN Web Docs",
      "url": "https://developer.mozilla.org/en-US/blog/rss.xml"
    },
    {
      "name": "MDN Documentation",
      "url": "https://developer.mozilla.org/en-US/docs/feeds/rss/all"
    },
    {
      "name": "W3C Blog",
      "url": "https://www.w3.org/blog/feed/"
    },
    {
      "name": "WebAIM Accessibilité",
      "url": "https://webaim.org/blog/feed/"
    },
    {
      "name": "A11Y Project",
      "url": "https://www.a11yproject.com/feed.xml"
    },
    {
      "name": "GitHub Blog",
      "url": "https://github.blog/feed/"
    },
    {
      "name": "Google News Accessibilité",
      "url": "https://news.google.com/rss/search?q=accessibilite+numerique"
    },
    {
      "name": "Google News Intelligence Artificielle",
      "url": "https://news.google.com/rss/search?q=intelligence+artificielle"
    }
  ],
  "notifications": {
    "telegram": true,
    "discord": false
  }
}
```

Un article est envoyé si son titre ou son résumé contient au moins un mot-clé. Le fichier `data/seen.json` évite d’envoyer deux fois le même article.

## 3. Créer le bot Telegram

Dans Telegram :

1. Ouvrir [@BotFather](https://t.me/BotFather).
2. Envoyer `/newbot`.
3. Choisir un nom et un identifiant pour le bot.
4. Copier le token fourni par BotFather.
5. Ouvrir le nouveau bot et cliquer sur **Start**.
6. Lui envoyer un message, par exemple `test`.

Le token est une donnée sensible. Ne jamais le mettre dans `config.json`, dans le code ou dans une capture d’écran.

## 4. Récupérer le chat ID Telegram

Dans le navigateur, ouvrir l’URL suivante en remplaçant `TON_TOKEN` par le token du bot :

```text
https://api.telegram.org/botTON_TOKEN/getUpdates
```

Repérer la valeur dans le bloc suivant :

```json
"chat": {
  "id": TON_CHAT_ID
}
```

Le `chat.id` est le numéro à utiliser pour recevoir les notifications. Ce n’est pas nécessairement l’identifiant du bot.

## 5. Ajouter les secrets GitHub

Dans le dépôt GitHub, ouvrir :

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Créer les deux secrets suivants :

```text
TELEGRAM_BOT_TOKEN = TON_TOKEN
TELEGRAM_CHAT_ID   = TON_CHAT_ID
```

Remplacer les valeurs par les vraies valeurs dans GitHub uniquement. Ne pas les écrire dans un fichier du dépôt.

Si un token a été publié par erreur, le révoquer avec BotFather et en générer un nouveau avant de continuer.

## 6. Automatiser la veille pendant la journée

Le fichier `.github/workflows/veille.yml` doit contenir une planification similaire à celle-ci :

```yaml
name: Veille RSS

on:
  schedule:
    - cron: "17 8-20 * * *"
      timezone: "Europe/Paris"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - name: Récupérer le dépôt
        uses: actions/checkout@v4

      - name: Installer Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Installer les dépendances
        run: npm install --no-audit --no-fund

      - name: Exécuter la veille
        run: node worker.mjs
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}

      - name: Sauvegarder les articles déjà vus
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update veille state"
          file_pattern: data/seen.json
```

Cette programmation lance la veille toutes les heures entre 8 h 17 et 20 h 17, heure de Paris. Elle ne s’exécute pas la nuit.

Le déclenchement manuel reste disponible avec `workflow_dispatch`.

## 7. Publier l’interface avec GitHub Pages

Dans le dépôt GitHub :

1. Ouvrir **Settings → Pages**.
2. Dans **Build and deployment**, sélectionner **GitHub Actions**.
3. Aller dans l’onglet **Actions**.
4. Lancer le workflow **Publier l’interface**.
5. Revenir dans **Settings → Pages** pour récupérer l’adresse publique.

L’adresse aura généralement cette forme :

```text
https://TON_COMPTE.github.io/NOM_DU_DEPOT/
```

## 8. Tester le système

Pour effectuer un test :

1. Ouvrir **Actions → Veille RSS**.
2. Cliquer sur **Run workflow**.
3. Ouvrir le détail de l’exécution.
4. Vérifier l’étape **Exécuter la veille**.

Une exécution réussie peut afficher :

```text
1 nouvelle(s) alerte(s).
```

ou :

```text
0 nouvelle(s) alerte(s).
```

`0` signifie qu’aucun nouvel article ne correspondait aux mots-clés, et non que Telegram est forcément mal configuré.

## 9. Résolution des problèmes fréquents

### `404 Not Found` avec Telegram

Le token est généralement invalide, incomplet ou contient un espace. Tester d’abord :

```text
https://api.telegram.org/botTON_TOKEN/getMe
```

La réponse attendue contient :

```json
"ok": true
```

### `result: []` avec `getUpdates`

Le bot n’a probablement pas encore reçu de message. Ouvrir le bot, cliquer sur **Start**, envoyer un message, puis relancer `getUpdates`.

### Aucun message Telegram malgré une exécution réussie

Vérifier :

- `TELEGRAM_BOT_TOKEN` dans les secrets GitHub ;
- `TELEGRAM_CHAT_ID` dans les secrets GitHub ;
- `notifications.telegram` à `true` ;
- la présence d’articles récents correspondant aux mots-clés ;
- les logs de l’étape **Exécuter la veille**.

### Erreur `Dependencies lock file is not found`

Supprimer la ligne suivante de `setup-node` si elle est présente :

```yaml
cache: npm
```

Le projet peut installer ses dépendances avec `npm install` sans fichier `package-lock.json`.

## 10. Bonnes pratiques de sécurité

- Ne jamais publier un token Telegram, une clé API ou un webhook Discord.
- Utiliser les **GitHub Actions Secrets** pour toutes les valeurs sensibles.
- Si un secret est exposé, le révoquer immédiatement puis en générer un nouveau.
- Ne pas placer de données personnelles dans les messages de commit.
- Garder `config.json` limité aux flux, mots-clés et options générales.

## Ressources officielles

- [GitHub Pages](https://docs.github.com/en/pages)
- [GitHub Actions — syntaxe des workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub Actions — secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Flux RSS MDN](https://developer.mozilla.org/en-US/docs/MDN/Contribute/Tools/Feeds.html)
