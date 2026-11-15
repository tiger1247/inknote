"""Builds the InkNote MSIX for the Microsoft Store.

    python packaging\\build_msix.py                              dev build (local test identity)
    python packaging\\build_msix.py --store packaging\\store.json  Store build

Needs Pillow (for the tile images) and MakeAppx in build\\tools (Microsoft.Windows.SDK.BuildTools).

The Electron runtime is taken from an existing InkNote/Electron 33 install (--runtime, default:
%LOCALAPPDATA%\\Programs\\InkNote) and the app code from this project. Output:
    %USERPROFILE%\\InkNote-build\\layout\\   loose files (Add-AppxPackage -Register for testing)
    build\\InkNote.msix                      the file you upload to Partner Center (the Store signs it)
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, "build")
# Outside OneDrive (locks files mid-build) and outside AppData (sandboxed tools get it redirected).
LAYOUT = os.path.join(os.path.expanduser("~"), "InkNote-build", "layout")
APP_FILES = ["main.js", "preload.js", "package.json", "src", "build/icon.png", "build/icon.ico"]


def find_makeappx():
    hits = glob.glob(os.path.join(BUILD, "tools", "sdk", "bin", "*", "x64", "makeappx.exe"))
    if not hits:
        sys.exit("makeappx.exe not found under build\\tools")
    return sorted(hits)[-1]


def copy_runtime(runtime):
    if not os.path.isfile(os.path.join(runtime, "electron.exe")):
        sys.exit(f"No electron.exe in {runtime}")
    for name in os.listdir(runtime):
        s = os.path.join(runtime, name)
        if name == "resources":
            continue
        d = os.path.join(LAYOUT, "InkNote.exe" if name == "electron.exe" else name)
        (shutil.copytree if os.path.isdir(s) else shutil.copy2)(s, d)
    os.makedirs(os.path.join(LAYOUT, "resources"))


def copy_app():
    dst = os.path.join(LAYOUT, "resources", "app")
    for rel in APP_FILES:
        s = os.path.join(ROOT, rel)
        d = os.path.join(dst, rel)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        (shutil.copytree if os.path.isdir(s) else shutil.copy2)(s, d)


def make_assets():
    from PIL import Image
    src = Image.open(os.path.join(ROOT, "build", "icon.png")).convert("RGBA")
    out = os.path.join(LAYOUT, "Assets")
    os.makedirs(out)
    for name, size in (("Square44x44Logo", 44), ("Square150x150Logo", 150), ("StoreLogo", 50)):
        src.resize((size, size), Image.LANCZOS).save(os.path.join(out, name + ".png"))
    wide = Image.new("RGBA", (310, 150), (0, 0, 0, 0))
    ic = src.resize((120, 120), Image.LANCZOS)
    wide.paste(ic, ((310 - 120) // 2, 15), ic)
    wide.save(os.path.join(out, "Wide310x150Logo.png"))


def write_manifest(cfg):
    with open(os.path.join(ROOT, "packaging", "AppxManifest.xml"), encoding="utf-8") as f:
        xml = f.read()
    for key in ("IDENTITY_NAME", "PUBLISHER", "PUBLISHER_DISPLAY", "VERSION", "DISPLAY_NAME"):
        xml = xml.replace("{{" + key + "}}", cfg[key.lower()])
    assert "{{" not in xml, "unfilled placeholder in manifest"
    with open(os.path.join(LAYOUT, "AppxManifest.xml"), "w", encoding="utf-8") as f:
        f.write(xml)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--store", help="JSON file with Partner Center identity values")
    ap.add_argument("--runtime", default=os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "InkNote"))
    ap.add_argument("--no-pack", action="store_true")
    args = ap.parse_args()

    cfg = {"identity_name": "InkNote.Dev", "publisher": "CN=InkNoteDev", "publisher_display": "InkNote (dev build)",
           "display_name": "InkNote", "version": "1.0.0.0"}
    if args.store:
        with open(args.store, encoding="utf-8") as f:
            cfg.update(json.load(f))

    if os.path.exists(LAYOUT):
        shutil.rmtree(LAYOUT)
    os.makedirs(LAYOUT)
    print("Copying Electron runtime…")
    copy_runtime(args.runtime)
    print("Copying app…")
    copy_app()
    make_assets()
    write_manifest(cfg)
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(LAYOUT) for f in fs)
    print(f"Layout ready: {LAYOUT} ({size / 1e6:.0f} MB)")

    if not args.no_pack:
        out = os.path.join(BUILD, "InkNote.msix")
        subprocess.run([find_makeappx(), "pack", "/d", LAYOUT, "/p", out, "/o"], check=True, stdout=subprocess.DEVNULL)
        print(f"Package: {out} ({os.path.getsize(out) / 1e6:.0f} MB)")


if __name__ == "__main__":
    main()
