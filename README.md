# Motion SaaS - AI Video Generation Platform

A full-stack SaaS platform that generates motion graphics videos using AI sub-agents. Users describe their idea, and the system creates a complete video with abstract visuals and voiceover.

## 🎯 How It Works

1. **User submits prompt** → 5 free credits (IP-based session)
2. **Prompt Analyzer** sub-agent extracts intent & emotion
3. **Art Director** sub-agent creates visual concept & storyboard
4. **Voice Script Writer** creates sectioned script with emotion tags
5. **ElevenLabs v3** generates voiceover with emotions
6. **Scene Generator** creates Remotion React components
7. **Video Renderer** renders final video
8. **User downloads** completed video

## 🏗️ Architecture

```
Frontend (Next.js 14)
├── Landing Page (Marketing)
├── Create Page (Video form + history)
└── API Routes
    ├── /api/generate - Submit video request
    ├── /api/status/[jobId] - Check status
    ├── /api/webhook - Sub-agent callbacks
    └── /api/credits - Check credits

Sub-Agent Pipeline
├── 1. Prompt Analyzer
├── 2. Art Director
├── 3. Voice Script Writer
├── 4. Scene Generator
└── 5. Video Renderer

Database (Supabase)
├── users (credits, session)
├── videos (status, URLs, metadata)
└── credit_transactions

Storage (Supabase)
├── voiceovers/ - Generated audio
└── videos/ - Rendered MP4s
```

## 💰 Credit System

| User Type | Free Credits | Price |
|-----------|--------------|-------|
| Anonymous (IP) | 5 | - |
| Logged In | +5 (10 total) | - |
| Paid - 10 videos | - | $5 ($0.50/video) |
| Paid - 50 videos | - | $20 ($0.40/video) |
| Paid - 200 videos | - | $60 ($0.30/video) |

**Cost Breakdown:**
- ElevenLabs API: ~$0.10
- Compute/Rendering: ~$0.30
- Storage: ~$0.05
- Margin: ~$0.05

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <repo>
cd motion-saas
npm install
```

### 2. Set up Supabase
```bash
# Create project at https://supabase.com
# Run the schema.sql in SQL Editor
```

### 3. Environment Variables
```bash
cp .env.local.example .env.local
# Fill in your keys
```

### 4. Run Development
```bash
npm run dev
```

## 📁 Project Structure

```
motion-saas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts      # Submit video
│   │   │   ├── status/[jobId]/route.ts # Check status
│   │   │   ├── webhook/route.ts        # Sub-agent callbacks
│   │   │   └── credits/route.ts        # Credit check
│   │   ├── page.tsx                    # Landing
│   │   ├── create/page.tsx             # Video form
│   │   └── layout.tsx
│   ├── components/
│   │   ├── VideoForm.tsx
│   │   └── VideoCard.tsx
│   └── lib/
│       ├── supabase.ts
│       ├── elevenlabs.ts
│       └── subagents.ts
├── supabase/
│   └── schema.sql
└── README.md
```

## 🎨 Sub-Agent Prompts

### Prompt Analyzer
Extracts: core message, emotion, visual style, duration, complexity, sections

### Art Director
Creates: color palette, typography, motion principles, section storyboards

### Voice Script Writer
Generates: sectioned script with ElevenLabs v3 emotion tags

### Scene Generator
Builds: Remotion React components with abstract visuals

## 🔑 Key Features

- **Abstract Motion Graphics** - Not just text, real particle/shape animations
- **ElevenLabs v3** - Emotion-tagged voiceover with sections
- **Sub-Agent Workflow** - Distributed AI processing
- **Credit System** - Free tier + pay-per-use
- **Session-Based** - No signup required to start
- **Vertical Format** - 1080x1920 (TikTok/Reels optimized)

## 🛣️ Roadmap

- [ ] Stripe payment integration
- [ ] Video templates/presets
- [ ] Custom voice cloning
- [ ] Background music generation
- [ ] Multi-language support
- [ ] API for developers

## 📄 License

MIT
