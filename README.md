# Codebase Navigator

AI-powered GitHub repository exploration and codebase Q&A tool.

## Features

- GitHub repository analysis
- File explorer
- Source code viewer
- Dependency graph
- Natural-language codebase Q&A
- Relevant-file evidence
- Repository history

## Frontend stack

- React + Vite
- React Router
- React Flow (`@xyflow/react`)
- AWS Amplify (hosting)
- API Gateway (backend)

## Environment

Copy `.env.example` to `.env` and set your API to VITE_API_URL

This must point at the deployed API Gateway stage. Never put AWS credentials or secrets in a `VITE_*` variable — it is bundled into the client and publicly visible.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deployment (AWS Amplify)

1. Push this repository to GitHub.
2. In the Amplify console, choose **New app → Host web app** and connect this GitHub repo/branch.
3. Amplify auto-detects the Vite build; confirm the build settings are roughly:
```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
```
4. Under **App settings → Environment variables**, add `VITE_API_URL` with your API Gateway URL.
5. Save and deploy. Amplify builds and hosts the app on every push to the connected branch.