param(
  [Parameter(Mandatory=$true)]
  [string]$Location,

  [Parameter(Mandatory=$true)]
  [string]$ResourceGroup,

  [Parameter(Mandatory=$true)]
  [string]$AcrName,

  [string]$EnvName = "neuro-env",
  [string]$BackendAppName = "neuro-backend",
  [string]$FrontendAppName = "neuro-frontend",

  [string]$BackendTag = "backend-1",
  [string]$FrontendTag = "frontend-1"
)

$ErrorActionPreference = "Stop"

Write-Host "== Deploying NeuroTraderX to Azure Container Apps ==" -ForegroundColor Cyan

# Optional app secrets from local environment
$openRouterKey = $env:OPENROUTER_API_KEY
$steadyToken = $env:STEADY_API_TOKEN

if ([string]::IsNullOrWhiteSpace($openRouterKey)) {
  Write-Warning "OPENROUTER_API_KEY is not set in your shell. Backend will use mock responses until you set it in Container Apps."
}

Write-Host "[1/8] Create resource group" -ForegroundColor Yellow
az group create -n $ResourceGroup -l $Location | Out-Null

Write-Host "[2/8] Create ACR (if missing)" -ForegroundColor Yellow
$acrExists = az acr show -g $ResourceGroup -n $AcrName 2>$null
if (-not $?) {
  az acr create -g $ResourceGroup -n $AcrName -l $Location --sku Basic | Out-Null
  if (-not $?) {
    throw "Failed to create ACR. Common causes: (1) RequestDisallowedByAzure = region restricted, try a different -Location; (2) MissingSubscriptionRegistration = provider not registered (Microsoft.ContainerRegistry). Try re-running after provider registration completes."
  }
}

# Ensure admin credentials are enabled so we can pull from ACR (simple path; production can use Managed Identity + AcrPull)
az acr update -n $AcrName --admin-enabled true | Out-Null

Write-Host "[3/8] Ensure Container Apps extension/providers" -ForegroundColor Yellow
az extension add --name containerapp --upgrade | Out-Null
az provider register --namespace Microsoft.App | Out-Null
az provider register --namespace Microsoft.OperationalInsights | Out-Null
az provider register --namespace Microsoft.ContainerRegistry | Out-Null

Write-Host "[4/8] Create Container Apps environment (if missing)" -ForegroundColor Yellow
$envExists = az containerapp env show -g $ResourceGroup -n $EnvName 2>$null
if (-not $?) {
  az containerapp env create -g $ResourceGroup -n $EnvName -l $Location | Out-Null
}

Write-Host "[5/8] Build & push backend image" -ForegroundColor Yellow
az acr build -r $AcrName -t "neuro-backend:$BackendTag" -f "server/Dockerfile" "./server" | Out-Null

# Registry credentials (simple path; for production use Managed Identity + AcrPull)
$acrCred = az acr credential show -n $AcrName | ConvertFrom-Json
$acrUser = $acrCred.username
$acrPass = $acrCred.passwords[0].value
$acrServer = "${AcrName}.azurecr.io"

Write-Host "[6/8] Create/Update backend Container App" -ForegroundColor Yellow

# Secrets + env vars
$secretsArgs = @()
$envVarsArgs = @()

if (-not [string]::IsNullOrWhiteSpace($openRouterKey)) {
  $secretsArgs += "openrouter-api-key=$openRouterKey"
  $envVarsArgs += "OPENROUTER_API_KEY=secretref:openrouter-api-key"
}
if (-not [string]::IsNullOrWhiteSpace($steadyToken)) {
  $secretsArgs += "steady-api-token=$steadyToken"
  $envVarsArgs += "STEADY_API_TOKEN=secretref:steady-api-token"
}

# Create backend (idempotent-ish: if create fails, try update)
$null = az containerapp create -g $ResourceGroup -n $BackendAppName --environment $EnvName `
  --image "${acrServer}/neuro-backend:$BackendTag" `
  --registry-server $acrServer --registry-username $acrUser --registry-password $acrPass `
  --ingress external --target-port 5000 `
  --secrets $secretsArgs `
  --env-vars $envVarsArgs 2>$null

if (-not $?) {
  az containerapp update -g $ResourceGroup -n $BackendAppName `
    --image "${acrServer}/neuro-backend:$BackendTag" `
    --set-registry-server $acrServer --set-registry-username $acrUser --set-registry-password $acrPass | Out-Null

  if ($secretsArgs.Count -gt 0) {
    az containerapp secret set -g $ResourceGroup -n $BackendAppName --secrets $secretsArgs | Out-Null
  }
  if ($envVarsArgs.Count -gt 0) {
    az containerapp update -g $ResourceGroup -n $BackendAppName --set-env-vars $envVarsArgs | Out-Null
  }
}

$backendFqdn = az containerapp show -g $ResourceGroup -n $BackendAppName --query "properties.configuration.ingress.fqdn" -o tsv
$backendUrl = "https://$backendFqdn"
Write-Host "Backend URL: $backendUrl" -ForegroundColor Green

Write-Host "[7/8] Build & push frontend image (baking API URL)" -ForegroundColor Yellow
az acr build -r $AcrName -t "neuro-frontend:$FrontendTag" -f "Dockerfile" --build-arg "VITE_API_BASE_URL=$backendUrl" "." | Out-Null

Write-Host "[8/8] Create/Update frontend Container App" -ForegroundColor Yellow

$null = az containerapp create -g $ResourceGroup -n $FrontendAppName --environment $EnvName `
  --image "${acrServer}/neuro-frontend:$FrontendTag" `
  --registry-server $acrServer --registry-username $acrUser --registry-password $acrPass `
  --ingress external --target-port 4173 2>$null

if (-not $?) {
  az containerapp update -g $ResourceGroup -n $FrontendAppName `
    --image "${acrServer}/neuro-frontend:$FrontendTag" `
    --set-registry-server $acrServer --set-registry-username $acrUser --set-registry-password $acrPass | Out-Null
}

$frontendFqdn = az containerapp show -g $ResourceGroup -n $FrontendAppName --query "properties.configuration.ingress.fqdn" -o tsv
$frontendUrl = "https://$frontendFqdn"
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Green

# Update backend CORS to allow the deployed frontend
Write-Host "Configuring backend CORS for frontend origin..." -ForegroundColor Yellow
az containerapp update -g $ResourceGroup -n $BackendAppName --set-env-vars "CORS_ALLOWED_ORIGINS=$frontendUrl" | Out-Null

Write-Host "== Done ==" -ForegroundColor Cyan
Write-Host "Open the app: $frontendUrl" -ForegroundColor Green
Write-Host "API base:    $backendUrl" -ForegroundColor Green
