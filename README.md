# Veille gratuite

Outil de veille basé sur RSS + GitHub Actions. Aucun abonnement, serveur ou base de données n'est nécessaire.

## Installation

1. Copiez `config.example.json` en `config/config.json` et adaptez les flux/mots-clés.
2. Créez un bot Telegram via [@BotFather](https://t.me/BotFather), puis ajoutez `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` dans les secrets GitHub. Ou créez un webhook Discord et ajoutez `DISCORD_WEBHOOK_URL`.
3. Activez GitHub Actions. Le workflow s'exécute chaque heure, sans frais dans les limites publiques GitHub.

Pour publier l'interface, allez dans **Settings → Pages**, choisissez **GitHub Actions** comme source, puis lancez le workflow `Publier l'interface`.

Pour tester localement :

```bash
npm install
node worker.mjs
```

Le filtrage s'effectue sur le titre et le résumé RSS. `data/seen.json` empêche les doublons.
