"""Builds the direct-download InkNote zip (for Gumroad / Lemon Squeezy).

    python packaging\\build_portable.py [--runtime <Electron 33 folder>]

Output: build\\InkNote-Windows.zip containing
    Install InkNote.cmd     copies the app to %LOCALAPPDATA%\\Programs\\InkNote, adds Desktop + Start-menu shortcuts
    Uninstall InkNote.cmd   removes the program and shortcuts (your notes in Documents\\InkNote are kept)
    READ ME FIRST.txt
    InkNote\\               Electron runtime (electron.exe renamed InkNote.exe) + app
"""
import argparse
import os
import shutil
import sys
import time
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_msix as bm

ROOT = bm.ROOT
STAGE = os.path.join(os.path.expanduser("~"), "InkNote-portable")
OUT = os.path.join(ROOT, "build", "InkNote-Windows.zip")

# INKNOTE_DEST lets us test the installer without touching an existing install.
INSTALL_CMD = r"""@echo off
setlocal
title Install InkNote
if defined INKNOTE_DEST (set "DEST=%INKNOTE_DEST%") else (set "DEST=%LOCALAPPDATA%\Programs\InkNote")
echo.
echo  Installing InkNote to %DEST% ...
taskkill /f /im InkNote.exe >nul 2>&1
robocopy "%~dp0InkNote" "%DEST%" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo  Copy failed. Close InkNote and run this again.
  pause
  exit /b 1
)
powershell -NoProfile -Command "$w = New-Object -ComObject WScript.Shell; foreach ($f in @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'))) { $s = $w.CreateShortcut((Join-Path $f 'InkNote.lnk')); $s.TargetPath = Join-Path $env:DEST 'InkNote.exe'; $s.WorkingDirectory = $env:DEST; $s.IconLocation = (Join-Path $env:DEST 'resources\app\build\icon.ico') + ',0'; $s.Description = 'InkNote - pen-first notebook'; $s.Save() }"
start "" "%DEST%\InkNote.exe"
echo.
echo  Done! InkNote is on your Desktop and in the Start menu.
echo.
timeout /t 6 >nul
"""

UNINSTALL_CMD = r"""@echo off
setlocal
title Uninstall InkNote
if defined INKNOTE_DEST (set "DEST=%INKNOTE_DEST%") else (set "DEST=%LOCALAPPDATA%\Programs\InkNote")
taskkill /f /im InkNote.exe >nul 2>&1
timeout /t 1 >nul 2>&1
rd /s /q "%DEST%" 2>nul
powershell -NoProfile -Command "foreach ($f in @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'))) { $l = Join-Path $f 'InkNote.lnk'; if (Test-Path $l) { $t = (New-Object -ComObject WScript.Shell).CreateShortcut($l).TargetPath; if ($t -like ($env:DEST + '*')) { Remove-Item $l } } }"
echo InkNote has been removed. Your notes are still in Documents\InkNote.
timeout /t 6 >nul
"""

README = """InkNote for Windows 10/11
=========================

A pen-first notebook: handwrite, highlight, draw shapes and type on ruled,
grid or dotted pages, then export to PDF. Free.

INSTALL
1. Right-click the zip > Extract All... (don't run it from inside the zip).
2. Double-click "Install InkNote.cmd".
   If Windows says "Windows protected your PC", click "More info" > "Run anyway".
3. InkNote opens and is added to your Desktop and Start menu.

Your notes are saved in Documents\\InkNote (with daily backups).

SMART APP CONTROL
If your PC has Smart App Control turned on and blocks this download,
install InkNote from the Microsoft Store instead - search "InkNote - Pen Notebook".

UNINSTALL
Double-click "Uninstall InkNote.cmd". Your notes in Documents\\InkNote are kept.

Source code and support: https://github.com/tiger1247/inknote
"""


def clear(path):
    for _ in range(5):
        if not os.path.exists(path):
            return
        try:
            shutil.rmtree(path)
        except OSError:
            time.sleep(2)
    os.rename(path, f"{path}-old-{int(time.time())}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runtime", default=os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "InkNote"))
    args = ap.parse_args()

    clear(STAGE)
    app_root = os.path.join(STAGE, "InkNote")
    os.makedirs(app_root)
    bm.LAYOUT = app_root  # reuse the MSIX helpers, pointed at the portable folder
    print("Copying Electron runtime…")
    bm.copy_runtime(args.runtime)
    print("Copying app…")
    bm.copy_app()
    for name, text in (("Install InkNote.cmd", INSTALL_CMD), ("Uninstall InkNote.cmd", UNINSTALL_CMD),
                       ("READ ME FIRST.txt", README)):
        with open(os.path.join(STAGE, name), "w", encoding="ascii", newline="\r\n") as fh:
            fh.write(text)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for root, _, files in os.walk(STAGE):
            for fn in files:
                full = os.path.join(root, fn)
                z.write(full, os.path.relpath(full, STAGE))
    print(f"Wrote {OUT} ({os.path.getsize(OUT) / 1e6:.0f} MB)")


if __name__ == "__main__":
    main()
