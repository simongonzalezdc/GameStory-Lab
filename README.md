# GameStory Lab

AI-assisted game design document (GDD) generator for indie developers — generate mechanics, write lore, validate consistency, and export complete documentation packages.

## Quick start

```bash
# 1. Clone and install (npm workspaces monorepo)
git clone https://github.com/simongonzalezdc/GameStory-Lab.git
cd GameStory-Lab
npm install
# 2. Configure environment
cp .env.example .env   # add API keys (all optional if you use Ollama)
# 3. Start infrastructure
docker-compose up -d   # PostgreSQL 17 + Redis 7
# 4. Initialize the database
cd packages/backend && npx prisma migrate dev && npx prisma generate && cd ../..
# 5. Run backend + frontend together
npm run dev
```

## Docs

- [TUTORIAL.md](TUTORIAL.md)
- [SETUP.md](SETUP.md)
- [QUICK_START.md](QUICK_START.md)
- [kyanitelabs.tech](https://kyanitelabs.tech)
- [Print-OS](https://github.com/simongonzalezdc/Print-OS)

## License

See [LICENSE](LICENSE).
