# Cross Chain

A simple Web3 dashboard that helps you keep an eye on your crypto wallet, spot risky tokens, and swap coins across blockchains safely.

## What does this website do?

Imagine you have crypto in many places — different tokens, different blockchains (Ethereum, Polygon, BNB, etc.). VaultSense puts everything in **one screen** so you can:

1. **See all your crypto in one place** — your portfolio across 5+ blockchains.
2. **Check if your tokens are safe** — flags scam tokens and dangerous contract approvals.
3. **Find the best swap route** — when you want to trade one coin for another, it shows you the cheapest and safest path.
4. **Get an AI report** — a quick summary written by AI about your wallet's health.
5. **Save your reports** — stores them on a decentralized storage network (0G).

Think of it like a **health checkup app**, but for your crypto wallet.

## How does it work?

### The big picture

The project is split into two parts:

- **Frontend** (what you see) — a React app built with Vite + Tailwind CSS.
- **Backend** (the brain) — a Next.js server that talks to external services.

### Step-by-step flow

1. **You connect your wallet**
   - Click `Connect Wallet 1` or `Connect Wallet 2` on the landing page.
   - The site uses a browser wallet (like MetaMask) to get your wallet address. No password or sign-up needed.

2. **It pulls your balances**
   - The backend calls **Moralis** to fetch all the tokens you hold across multiple chains.
   - The result shows up as a clean table on the **Portfolio** page.

3. **It runs a security scan**
   - For every token you own, the backend calls **GoPlus Security** to check for red flags (honeypots, fake contracts, risky approvals).
   - You see a health score and a list of warnings on the **Security** page.

4. **It can find swap routes**
   - Want to trade Token A for Token B? The backend asks **LI.FI** for the best route across bridges and DEXes.
   - The **SmartSwap** page shows you gas cost, time, and the path the trade will take.

5. **It generates an AI report**
   - When you ask, the backend sends your portfolio + scan results to **Google Gemini AI**.
   - The AI writes a simple summary with suggestions.
   - The report is saved on **0G decentralized storage** so it's tamper-proof. If 0G is down, it falls back to your browser's localStorage.

### The pages

| Page | What it shows |
|---|---|
| **Landing** | Welcome page with the connect buttons and feature highlights. |
| **Dashboard** | Overview of your portfolio, security score, and the latest AI report. |
| **Portfolio** | A sortable, filterable table of all your tokens. You can export to CSV. |
| **Security** | A health gauge, risk table, and a button to export your security report as PDF. |
| **SmartSwap** | Compare swap routes and execute trades. Swap history is saved locally. |
| **Intelligence** | AI-generated reports with history pulled from 0G storage. |

### Tech used (in plain words)

- **React 19 + Vite** — the website framework.
- **Tailwind CSS** — makes the design look clean.
- **Framer Motion** — adds smooth animations.
- **Next.js** — runs the backend API routes.
- **Moralis** — gets your token balances from blockchains.
- **GoPlus** — checks if contracts are scams.
- **LI.FI** — finds the best swap routes.
- **Google Gemini** — writes the AI report.
- **0G Storage** — stores reports in a decentralized way.
- **ethers.js** — talks to your wallet.

## How to run it locally

You need **two terminals** open at the same time.

**Terminal 1 — backend:**
```bash
npm install
npx next dev --webpack -p 3000
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npx vite --port 5173
```

Then open `http://localhost:5173` in your browser.

## A note

This is a **hackathon demo**. There is no login or user accounts. If you don't have a wallet installed, the site shows demo data so you can still explore the UI.
