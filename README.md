# Pantheon Pandemonium

A turn-based strategy roguelite where players become proto-gods, shaping the land to their divine will while competing against rivals and the ever-creeping Shadow faction.

## 🎮 Game Overview

**Pantheon Pandemonium** combines elegant strategy mechanics with roguelite replayability. Choose your divine Domain, capture territories, sanctify sacred sites, and ascend to godhood through multiple victory paths.

### Key Features

- **8 Unique Domains**: Fire, Water, Earth, Air, Life, Death, Order, and Chaos - each with distinct playstyles
- **Dynamic World**: Tiles visually transform based on your Domain's influence
- **The Shadow**: A neutral third faction that spreads corruption - fight it or befriend it
- **Multiple Victory Conditions**: Conquest, Sanctification, Shadow Accord, or Relic Ascension
- **Roguelite Elements**: Randomized maps, events, and relics ensure each playthrough is unique
- **Data-Driven Design**: All content is JSON-based for easy modding and expansion

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, React, Tailwind CSS
- **Game Engine**: Custom TypeScript engine with PIXI.js for rendering
- **Backend**: Node.js, Express, Socket.io for multiplayer
- **Database**: Google Firestore
- **Storage**: Google Cloud Storage
- **Deployment**: Vercel (frontend), Google Cloud Run (backend)
- **Authentication**: Firebase Auth
- **Analytics**: Google Analytics, Custom game telemetry

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Google Cloud account with project created
- Firebase project (can be same as Google Cloud project)
- Vercel account (for deployment)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pantheon-pandemonium.git
cd pantheon-pandemonium
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. Set up Google Cloud credentials:
   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Place it in `credentials/service-account.json`
   - Set `GOOGLE_APPLICATION_CREDENTIALS` in .env.local

5. Initialize Firebase:
   - Go to Firebase Console
   - Create a web app
   - Copy the config values to .env.local

## 🎯 Development

Run the development server:
```bash
npm run dev
```

Run the game server (for multiplayer):
```bash
npm run server:dev
```

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## 🏗️ Project Structure

```
pantheon-pandemonium/
├── app/                 # Next.js app directory
│   ├── game/           # Game UI pages
│   ├── lobby/          # Multiplayer lobby
│   └── api/            # API routes
├── components/          # React components
├── lib/                # Core libraries
│   ├── game/           # Game engine modules
│   └── services/       # External services
├── server/             # Backend server
│   └── services/       # Google Cloud integrations
├── data/               # Game content (JSON)
│   ├── domains.json    # Domain definitions
│   ├── units.json      # Unit types
│   └── events.json     # Game events
├── types/              # TypeScript definitions
├── config/             # Configuration files
└── public/             # Static assets
```

## 🎮 Game Mechanics

### Resources
- **Divinity**: Primary action currency (refreshed each turn)
- **Faith**: Slow-build economy for miracles
- **Shadow Energy**: Risky resource for Shadow interactions
- **Aegis**: Defensive reserve from unspent Divinity

### Core Actions
- **Explore/Move**: Reveal fog and navigate units
- **Capture**: Seize control of tiles
- **Manage**: Fortify, Purify, Build Shrines
- **Sanctify**: Attune tiles to your Domain
- **Summon**: Deploy units to the battlefield
- **Miracles**: Powerful one-time effects

### Victory Conditions
- **Conquest**: Control 75% of revealed tiles
- **Sanctifier**: Sanctify 6 holy sites
- **Shadow Accord**: Achieve 100 Shadow alignment
- **Relic Ascension**: Collect 3 unique relics

## 📊 Database Schema

The game uses Firestore with the following collections:
- `games`: Active and completed game states
- `players`: Player profiles and statistics
- `sessions`: Game sessions and matchmaking
- `analytics`: Gameplay telemetry data
- `gamestates`: Saved game states for resuming

## 🚢 Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Google Cloud Run)
```bash
gcloud run deploy pantheon-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## 🎯 Roadmap

- [x] Core game engine
- [x] All 8 Domains implemented
- [x] Map generation system
- [x] Shadow faction mechanics
- [ ] Multiplayer support
- [ ] AI opponents
- [ ] Visual effects and animations
- [ ] Sound and music
- [ ] Mobile responsive design
- [ ] Steam release preparation

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📜 License

Copyright (c) 2024 Pantheon Games. All rights reserved.

## 🙏 Acknowledgments

- Game design inspired by Civilization, Polytopia, and Slay the Spire
- Built with love using open-source technologies

## 📞 Support

For support, email support@pantheongames.com or join our Discord server.

---

**Play Now**: [pantheon-pandemonium.vercel.app](https://pantheon-pandemonium.vercel.app)
**Documentation**: [docs.pantheongames.com](https://docs.pantheongames.com)