# AGENTS.md

## Project

Personal Hexo blog (Chinese/zh-CN) at `https://www.hoboro.top`. Theme: **Kratos:Rebirth** v3.x.

## Commands

| Command | Does |
|---|---|
| `pnpm run server` | Dev server on port 4000 (hot reload) |
| `pnpm run build` | Generate static site into `public/` |
| `pnpm run clean` | Delete `public/` and Hexo cache |
| `pnpm install --frozen-lockfile` | Install deps (use this, not `pnpm install` alone) |
| `npx hexo new "post title"` | Scaffold a new post |
| `npx hexo new draft "title"` | Scaffold a draft |

There are **no lint, test, or typecheck scripts**. CI uses `npx hexo generate --force`.

## Architecture

- **Source content**: `source/_posts/` — Markdown posts with Hexo frontmatter. Posts are organized by category in subdirectories (anime/, nas/, cook/, etc.).
- **Config**: `_config.yml` (Hexo), `_config.kratos-rebirth.yml` (theme). Theme config is extensive — nav, sidebar, comments, sharing, CDN URLs all live there.
- **Custom injections**: `source/extentions/` — JS/CSS injected into every page (Waline comments, Mermaid, custom styling).
- **CDN**: All images/assets served from Qiniu Cloud (`img.hoboro.top`). Upload script: `upload_qiniu.cjs`.
- **Comments**: Waline, self-hosted at `waline.hoboro.top`.
- Built output is `public/` (gitignored).

## CI/CD (`.github/workflows/build.yml`)

- **Trigger**: push to `main`, pull requests.
- **build** job: `pnpm install --frozen-lockfile` → `npx hexo generate --force`.
- **deploy-github-page** (main only): deploys `public/` to GitHub Pages.
- **deploy-qiniu** (main only): uploads `public/` to Qiniu Cloud Storage + CDN cache refresh.
- Dependabot runs daily for npm updates.

## Key conventions

- **Package manager**: pnpm v9 only. The lockfile is `pnpm-lock.yaml` v9.0. Never use npm/yarn.
- **CI uses `--force`**: `hexo generate --force` regenerates even if cache suggests no changes.
- **No `hexo deploy`**: The `deploy` config in `_config.yml` is empty. Real deployment is CI-only.
- **Permalink pattern**: `posts/:title/` — changing this breaks all existing URLs.
- **Post frontmatter** fields include: `title`, `date`, `categories`, `tags`, `sticky`, `cover`, `comments`, `toc`, `donate`, `share`. See `scaffolds/post.md` for the template.
- **Theme config** controls most site behavior (nav, widgets, CDN URLs, footer). Post content goes in `source/_posts/`; presentation changes go in `_config.kratos-rebirth.yml`.
