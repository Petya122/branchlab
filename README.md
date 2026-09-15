# 🌿 BranchLab — GitFlow & CI/CD Pipeline Simulator

[![CI/CD Pipeline](https://github.com/Petya122/branchlab/actions/workflows/ci.yml/badge.svg)](https://github.com/Petya122/branchlab/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://branchlab.me)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-green?logo=vitest)](https://vitest.dev/)

> **University DevOps School Project**  
> **Course:** DevOps és tesztelés (5. Félév) — Soproni Egyetem  
> **Repository:** [https://github.com/Petya122/branchlab](https://github.com/Petya122/branchlab)  
> **Production Target:** [https://branchlab.me](https://branchlab.me)

---

## 📖 Overview

**BranchLab** is an interactive web-based simulator designed to teach and demonstrate modern DevOps branching workflows and automated release pipelines. It models:

1. **Git Branching Strategies:**
   - **GitFlow** (`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`)
   - **Trunk-Based Development** (single source trunk with short-lived feature branches)
   - **GitHub Flow** (lightweight PR-to-main strategy)
2. **CI/CD Pipeline Simulation:**
   - Visual execution of Lint, Vitest Unit Tests, SAST Security Audit, Vite Build, and Vercel Deployment.
   - Real-time terminal log outputs and exit code status.
   - **Chaos Mode / Error Injection:** Simulate broken unit tests or lint errors to demonstrate branch protection gates.
3. **Interactive DevOps Challenges:**
   - Emergency production hotfix scenarios.
   - Defending CI quality gates.
   - Feature release workflows.

---

## 🛠️ Technology Stack

- **Frontend:** React 19 + Vite (TypeScript)
- **Styling:** Custom Vanilla CSS design system with CSS variables, obsidian dark mode, glowing branch rails, and glassmorphic cards.
- **Testing:** Vitest + React Testing Library + `@testing-library/jest-dom`
- **Icons & Effects:** `lucide-react`, `canvas-confetti`
- **CI/CD Automation:** GitHub Actions (`.github/workflows/ci.yml`)
- **Hosting & DNS:** Vercel with custom domain `branchlab.me`

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to explore the interactive dashboard.

### 3. Run Automated Tests
```bash
npm run test:run
```

### 4. Typecheck & Production Build
```bash
npm run typecheck
npm run build
```

---

## 🧪 DevOps & Testing Architecture

| Test Level | Tool | Scope |
| :--- | :--- | :--- |
| **Type Integrity** | `tsc -b` | Zero any, strict null checks, typed Git DAG and pipeline state machines |
| **Unit Tests** | `vitest` | State reducers for commits, branches, DAG parents, and CI stage evaluators |
| **Component Tests** | `@testing-library/react` | Visualizer rendering, model switcher, modal actions, chaos toggles |
| **CI Automation** | **GitHub Actions** | Automated validation on every `push` and `pull_request` to `main` |
| **Deployment** | **Vercel** | Automated continuous deployment with edge SSL on `branchlab.me` |
