# ShipLab

**Post-Production AI Tool for Developers**

ShipLab is a local-first web application that helps developers transform finished code into shipped, marketed, and maintained products. It provides AI-powered analysis, documentation generation, licensing assistance, marketing content creation, and deployment guidance.

## 🎯 Vision

To become the essential "last mile" tool that every solo developer uses to transform finished code into shipped, marketed, and maintained products.

## ✨ Features (Phase 1 - MVP)

### ✅ Completed (Week 1 - Foundation)
- ✅ Next.js 15 application with TypeScript and Tailwind CSS
- ✅ SQLite database with Drizzle ORM
- ✅ LLM integration (Ollama for local, OpenRouter for cloud models)
- ✅ Project management (create, list, view projects)
- ✅ AI chat interface with context-aware responses
- ✅ shadcn/ui component library

### 🚧 In Progress (Weeks 2-6)
- 🔄 Code Quality Analysis (ESLint + Semgrep)
- 🔄 Documentation Generator (README + API docs)
- 🔄 Licensing Assistant
- 🔄 Marketing Content Generator
- 🔄 Deployment Guide & Config Generator

## 🚀 Getting Started

### Prerequisites

- Node.js 22 LTS or later
- npm (comes with Node.js)
- [Ollama](https://ollama.com) installed locally (for free AI models)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ShipLab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL`: SQLite database path (default: `file:./local.db`)
   - `OLLAMA_HOST`: Ollama server URL (default: `http://localhost:11434`)
   - `OPENROUTER_API_KEY`: (Optional) For cloud AI models

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Install Ollama models** (for local AI)
   ```bash
   # Install Ollama first: https://ollama.com/download
   ollama pull smollm2:1.7b
   ollama pull llama3.2:3b
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.6
- **Database**: SQLite (local) with Drizzle ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **AI**: Ollama (local) + OpenRouter (cloud)
- **Testing**: Vitest + Playwright

## 📁 Project Structure

```
shiplab/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── llm/            # LLM endpoints
│   │   │   └── projects/       # Project CRUD endpoints
│   │   ├── dashboard/          # Dashboard pages
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── chat/               # Chat interface
│   ├── lib/                    # Core libraries
│   │   ├── ai/                 # LLM integration
│   │   ├── db/                 # Database layer
│   │   └── utils.ts            # Utilities
│   └── types/                  # TypeScript types
├── Dev Docs/                   # Project documentation
├── drizzle/                    # Database migrations
├── public/                     # Static assets
└── tests/                      # Test files
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Apply migrations
npm run db:studio    # Open Drizzle Studio

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm test             # Run tests
npm run test:coverage # Run tests with coverage
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database path | `file:./local.db` | Yes |
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` | Yes (for local AI) |
| `OPENROUTER_API_KEY` | OpenRouter API key | - | No (for cloud AI) |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` | Yes |

## 🤖 AI Models

### Local Models (Free, Private)
- **SmolLM2 1.7B**: Fast, lightweight model for basic tasks
- **Llama 3.2 3B**: Balanced performance and quality
- **Qwen2.5 Coder 7B**: Optimized for code understanding
- **DeepSeek Coder V2 16B**: Advanced code analysis

### Cloud Models (via OpenRouter)
- **GPT-4o Mini**: Cost-effective OpenAI model
- **Claude 3.5 Sonnet**: High-quality Anthropic model
- **Gemini 2.0 Flash**: Google's latest free model
- **DeepSeek Chat**: Affordable conversation model

## 📊 Roadmap

### Phase 1: MVP (Weeks 1-6) - Current
- ✅ Week 1: Foundation (Next.js, DB, LLM) - **COMPLETED**
- 🔄 Week 2-3: Core analysis modules (quality, docs)
- 🔄 Week 4: Marketing + deployment features
- 🔄 Week 5: Testing, bug fixes, polish
- 🔄 Week 6: Beta launch preparation

### Phase 2: Enhancement (Weeks 7-18)
- Team collaboration features
- Git integration
- Custom rule sets
- Visual deployment dashboard

### Phase 3: Scale (Weeks 19-30)
- Mobile app
- Browser extension
- Plugin marketplace
- Advanced AI models

See [Dev Docs/04-roadmap.md](Dev%20Docs/04-roadmap.md) for complete roadmap.

## 🤝 Contributing

ShipLab is currently in active development (Phase 1 MVP). Contributions will be welcome after the initial release.

## 📄 License

This project will be open source with a freemium model (license to be determined).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Local AI powered by [Ollama](https://ollama.com)
- Cloud AI via [OpenRouter](https://openrouter.ai)

## 📞 Support

For issues and questions:
- GitHub Issues: (coming soon)
- Documentation: See `Dev Docs/` folder

---

**Status**: 🚧 Phase 1 - Week 1 Complete (Foundation)
**Next Milestone**: Week 2 - Code Quality Analysis
**Target Launch**: January 5, 2026
