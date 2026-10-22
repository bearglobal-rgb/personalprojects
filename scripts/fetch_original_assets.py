"""Fetch the five original photographs, then localize their existing references.

Uses the configured HTTPS proxy and default TLS verification. Run only after
source-host access is enabled: python scripts/fetch_original_assets.py
"""
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://swanacademy.whop.site/"
FILES = (
    "origin-bahia.png", "origin-school.png", "origin-immersion.png",
    "origin-cave.png", "jota.jpg",
)


def fetch_originals():
    # Fetch and validate the entire set before modifying the HTML.
    downloads = {}
    for name in FILES:
        try:
            with urlopen(BASE + name, timeout=30) as response:
                data = response.read()
        except (URLError, TimeoutError) as error:
            print(f"Cannot download {name}: {error}", file=sys.stderr)
            return 1
        signature = b"\x89PNG\r\n\x1a\n" if name.endswith(".png") else b"\xff\xd8\xff"
        if not data.startswith(signature):
            print(f"Unexpected image format for {name}; no references changed.", file=sys.stderr)
            return 1
        downloads[name] = data

    destination = ROOT / "public" / "assets"
    destination.mkdir(parents=True, exist_ok=True)
    for name, data in downloads.items():
        target = destination / name
        if target.exists() and target.read_bytes() != data:
            print(f"Existing {name} differs; preserve it and review manually.", file=sys.stderr)
            return 1
    html_path = ROOT / "index.html"
    html = html_path.read_text()
    for name, data in downloads.items():
        (destination / name).write_bytes(data)
        html = html.replace(BASE + name, "/assets/" + name)
    html_path.write_text(html)
    print("Saved all five original photographs and localized image references. Run npm run build.")
    return 0


if __name__ == "__main__":
    sys.exit(fetch_originals())
