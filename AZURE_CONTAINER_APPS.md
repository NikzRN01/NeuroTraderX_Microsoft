# Deploy to Azure Container Apps (ACA)

This repo is a 2-service app:
- **backend**: Flask API (port 5000)
- **frontend**: Vite preview server (port 4173)

## Prereqs
- Azure CLI installed (`az --version`)
- Logged in: `az login`
- Permission to create RG/ACR/Container Apps in your subscription

## One-command deploy (PowerShell)
1) Set your subscription:

`az account set --subscription "<SUBSCRIPTION_ID>"`

2) Set secrets in your PowerShell session (recommended):

`$env:OPENROUTER_API_KEY = "..."`

`$env:STEADY_API_TOKEN = "..."` (optional)

3) Run deploy script:

`scripts/deploy-aca.ps1 -Location eastus -ResourceGroup neuro-rg -AcrName <uniqueAcrName>`

## What the script does
- Creates Resource Group, ACR, Container Apps environment
- Builds & pushes images to ACR using `az acr build`
- Creates `neuro-backend` and `neuro-frontend` Container Apps
- Rebuilds frontend with `VITE_API_BASE_URL=https://<backend-fqdn>` baked in
- Sets backend CORS via `CORS_ALLOWED_ORIGINS=https://<frontend-fqdn>`

## Outputs
The script prints:
- Backend URL (API)
- Frontend URL (site)

## Notes
- Vite `preview` is used to serve the frontend. For a production-hardening step, consider serving `dist/` via Nginx (optional).
