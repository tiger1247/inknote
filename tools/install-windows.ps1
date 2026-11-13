# Installs InkNote for the current user on top of the official (signed) Electron runtime,
# so it runs even with Windows Smart App Control turned on.
# Usage (from the project folder):  powershell -ExecutionPolicy Bypass -File tools\install-windows.ps1
$ErrorActionPreference = 'Stop'
$proj = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $env:LOCALAPPDATA 'Programs\InkNote'
$runtime = Join-Path $proj 'node_modules\electron\dist'
if (-not (Test-Path "$runtime\electron.exe")) { throw "Electron runtime not found at $runtime (run npm install first)" }

Get-Process -Name electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$dest*" } | Stop-Process -Force

# 1) runtime (copied once, or refreshed when Electron version changes)
$verFile = Join-Path $dest 'version'
$want = (Get-Content (Join-Path $runtime 'version') -Raw).Trim()
if (-not (Test-Path $verFile) -or (Get-Content $verFile -Raw).Trim() -ne $want) {
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  New-Item -ItemType Directory -Force $dest | Out-Null
  Copy-Item -Recurse -Force "$runtime\*" $dest
  Remove-Item -Force (Join-Path $dest 'resources\default_app.asar') -ErrorAction SilentlyContinue
}

# 2) app files -> resources\app (Electron loads this folder automatically)
$app = Join-Path $dest 'resources\app'
if (Test-Path $app) { Remove-Item -Recurse -Force $app }
New-Item -ItemType Directory -Force "$app\build" | Out-Null
Copy-Item (Join-Path $proj 'main.js'), (Join-Path $proj 'preload.js') $app
Copy-Item -Recurse (Join-Path $proj 'src') $app
Copy-Item (Join-Path $proj 'build\icon.png'), (Join-Path $proj 'build\icon.ico') "$app\build"
@{ name = 'inknote'; productName = 'InkNote'; version = '1.0.0'; main = 'main.js' } | ConvertTo-Json | Set-Content -Encoding ascii "$app\package.json"

# 3) shortcuts (Desktop + Start menu)
$ws = New-Object -ComObject WScript.Shell
$targets = @([Environment]::GetFolderPath('Desktop'), (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'))
foreach ($dir in $targets) {
  $lnk = $ws.CreateShortcut((Join-Path $dir 'InkNote.lnk'))
  $lnk.TargetPath = Join-Path $dest 'electron.exe'
  $lnk.WorkingDirectory = $dest
  $lnk.IconLocation = "$app\build\icon.ico,0"
  $lnk.Description = 'InkNote - pen notes'
  $lnk.Save()
}
Write-Host "InkNote installed to $dest"
Write-Host "Shortcuts created on the Desktop and in the Start menu."
