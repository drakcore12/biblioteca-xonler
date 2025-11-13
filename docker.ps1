# Script de ayuda para Docker en PowerShell
# Uso: .\docker.ps1 <comando>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string[]]$Command
)

$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

# Ejecutar comando docker
& $dockerPath $Command

