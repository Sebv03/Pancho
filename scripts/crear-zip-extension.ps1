# Crea un ZIP de la extensión Chrome listo para distribuir
# Ejecutar: .\scripts\crear-zip-extension.ps1
# O: npm run extension:zip
# PowerShell viene con Windows - no requiere instalar nada

$root = Split-Path $PSScriptRoot -Parent
$extensionPath = Join-Path $root "chrome-extension"
$outputZip = Join-Path $root "albaterra-extension.zip"

if (-not (Test-Path $extensionPath)) {
    Write-Host "Error: No se encuentra chrome-extension" -ForegroundColor Red
    exit 1
}

if (Test-Path $outputZip) { Remove-Item $outputZip -Force }
Compress-Archive -Path $extensionPath -DestinationPath $outputZip -Force

Write-Host "ZIP creado: albaterra-extension.zip" -ForegroundColor Green
Write-Host "Comparte este archivo. El usuario extrae el ZIP y carga la carpeta chrome-extension en chrome://extensions" -ForegroundColor Cyan
