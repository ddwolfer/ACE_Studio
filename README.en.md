# 🎵 ACE Studio

[繁體中文](README.md) | **English**

> A local tool for generating **game background music (BGM) and sound effects (SFX)** from text.
> Dark DAW-style interface; BGM is powered by the open-source [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5), short SFX by [Stable Audio Open](https://huggingface.co/stabilityai/stable-audio-open-1.0), and everything can be driven in natural language from Claude Code via **MCP**.

---

## What it is / Architecture

ACE Studio is the **frontend product**; the two generation engines are **external services** it talks to (decoupled — engines are never committed to this repo).

```
┌─────────────────────┐  /api   ┌──────────────────────────────┐
│ Frontend React+Vite  │ ──────▶ │ engine/      ACE-Step (BGM)   │ :8001
│ :5173               │  /sfx   ├──────────────────────────────┤
│ BGM/SFX toggle,queue │ ──────▶ │ engine-sfx/  Stable Audio(SFX)│ :8002
│ library, waveform    │  HTTP   ├──────────────────────────────┤
└─────────────────────┘ ──────▶ │ server/      local helper     │ :8787
                                 │ (trim silence / persist / open folder)
   Claude Code ──MCP(stdio)──▶  └──────────────────────────────┘
   (mcp-server/: natural-language generation, hits the same three services)
```

---

## Requirements

- **Windows / macOS / Linux**
  - Windows/Linux: **NVIDIA GPU ≥ 8GB VRAM** recommended (8GB works with CPU offload — already wired into the scripts)
  - macOS: Apple Silicon runs on **MPS** (slower but functional; the engine also ships `engine/start_api_server_macos.sh`)
- [uv](https://docs.astral.sh/uv/) (Python env manager; setup installs it automatically)
- **Node.js 18+** (frontend / helper / MCP)
- **ffmpeg** (audio output)

---

## From clone to running

```powershell
git clone https://github.com/ddwolfer/ACE_Studio.git
cd ACE_Studio

# 1) Core (BGM engine + model + frontend)
powershell -ExecutionPolicy Bypass -File .\setup.ps1   # macOS/Linux: bash setup.sh

# 2) (Optional) SFX engine — only needed for 0.5–8 s short sound effects
.\setup-sfx.ps1                                        # macOS/Linux: bash setup-sfx.sh
#    Then two manual authorization steps (gated model, see engine-sfx/README.md):
#    a. Log into HuggingFace and click "Agree and access repository" on the model page
#    b. engine-sfx\.venv\Scripts\hf.exe auth login     # mac: engine-sfx/.venv/bin/hf

# 3) (Optional) Claude Code MCP interface
cd mcp-server; npm install; cd ..
```

`setup` does: clone the ACE-Step engine into `engine/` → `uv sync` → download the v15-turbo model (2B, 8GB-friendly) → install frontend deps.

> Model weights are downloaded into `engine/checkpoints/` (several GB) and the HF cache — **never committed**.

---

## Start

- **Windows**: double-click `start.cmd` (= BGM engine :8001 + helper :8787 + SFX :8002 + frontend, one window each)
- **macOS / Linux**: `bash start.sh` (starts everything in the background; Ctrl-C stops all)

```powershell
# Or start individually:
.\run-engine.ps1                 # BGM engine (macOS/Linux: bash run-engine.sh)
.\run-local.ps1                  # local helper (macOS/Linux: bash run-local.sh)
.\run-sfx.ps1                    # SFX engine  (macOS/Linux: bash run-sfx.sh)
cd frontend; npm run dev         # frontend
```

Open `http://localhost:5173` → click "Initialize service" → describe the music / set length → generate.

## Driving it from Claude Code (MCP)

The repo root has `.mcp.json`; open Claude Code inside this folder and the `ace-studio` MCP server loads automatically (run `cd mcp-server && npm install` once first). Keep the services running via `start.cmd` / `start.sh`, then just ask in natural language:

> Make me an 8-bit style SFX pack: coin, jump, and hurt — 2 variations each

Claude decomposes the task, writes English prompts, and calls the generation tools one by one; results go through the same "trim → persist to `library/`" pipeline, so **they appear in the app's library within 5 seconds** (no refresh needed). Available tools: `generate_bgm`, `generate_sfx`, `list_library`, `remove_item`, `studio_status`. Any MCP-capable client (Claude Desktop, Cursor, …) can mount the same server.

---

## Project layout

```
ACE_Studio/
├── README.md / README.en.md ← you are here (zh / en)
├── CLAUDE.md                ← auto-read guide for AI assistants (Claude Code etc.)
├── start.cmd / start.sh     ← one-shot launcher (Windows double-click / mac·Linux bash)
├── setup.ps1 / setup.sh     ← one-shot installer (engine + model + frontend)
├── setup-sfx.ps1 / .sh      ← SFX engine installer (run once)
├── run-engine.* / run-local.* / run-sfx.*
├── .mcp.json                ← auto-loads the MCP server in Claude Code
├── frontend/                ← React + Vite frontend
├── server/                  ← local helper :8787 (open folder / trim silence / library persistence)
├── mcp-server/              ← MCP server (AI clients drive generation)
├── engine-sfx/              ← SFX engine :8002 (Stable Audio Open; .venv and out/ gitignored)
├── docs/                    ← all documentation (zh-TW)
├── design/                  ← design source notes (frontend.pen)
├── engine/                  ← (gitignored) ACE-Step engine + models, installed by setup
└── library/                 ← (gitignored) persisted library (library.json + audio/)
```

---

## Documentation

All docs live in `docs/` (written in Traditional Chinese):

| Doc | Content |
|------|------|
| [docs/IMPLEMENTATION-SPEC.md](docs/IMPLEMENTATION-SPEC.md) | **Implementation spec**: verified acestep-api endpoints, field mappings, decisions, milestones |
| [docs/FRONTEND-SPEC.md](docs/FRONTEND-SPEC.md) | Frontend design spec: layout, palette, component copy, prompt composition |
| [docs/PROMPT-GUIDE.md](docs/PROMPT-GUIDE.md) | Prompt writing guide (game BGM / SFX recipes) |
| [docs/WEB-UI-GUIDE.md](docs/WEB-UI-GUIDE.md) | Plain-language guide to ACE-Step's native Web UI (incl. 8GB settings) |
| [docs/SFX-ENGINE.md](docs/SFX-ENGINE.md) | Dual-engine SFX design (default Stable Audio Open / fallback AudioGen) + **license comparison — read before commercial use** |

---

## Status

M1 (single-track pipeline) → M2 (presets + queue) → M3 (disk persistence + settings) → M4 (SFX dual engine) → M5 (MCP interface) are all **done**. Scheduled generation was cancelled; an in-app chat panel may be revisited later.

---

## License

ACE Studio code: MIT.
The [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) engine (MIT) is **installed separately**, not redistributed by this repo.
SFX via Stable Audio Open: free for commercial use under US$1M annual revenue, but requires [Stability registration](https://stability.ai/license) and a "Powered by Stability AI" attribution (already shown in the UI).
