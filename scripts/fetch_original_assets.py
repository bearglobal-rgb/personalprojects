"""Fetch the five photographs served by the source website, without re-encoding.

These served files are not 4K masters. Uses default TLS verification: python scripts/fetch_original_assets.py
"""
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://swanacademy.whop.site/"
FILES = {
    "origin-bahia.png": "origin-bahia.jpg",
    "origin-school.png": "origin-school.jpg",
    "origin-immersion.png": "origin-immersion-original.jpg",
    "origin-cave.png": "origin-cave.jpg",
    "jota.jpg": "jota.jpg",
}


def fetch_originals():
    # Fetch and validate the entire set before modifying the HTML.
    downloads = {}
    for name, local_name in FILES.items():
        try:
            with urlopen(Request(BASE + name, headers={"User-Agent": "Mozilla/5.0", "Referer": BASE}), timeout=30) as response:
                data = response.read()
        except (URLError, TimeoutError) as error:
            print(f"Cannot download {name}: {error}", file=sys.stderr)
            return 1
        # The source serves JPEG bytes, even for its .png URLs.
        signature = b"\xff\xd8\xff"
        if not data.startswith(signature):
            print(f"Unexpected image format for {name}; no references changed.", file=sys.stderr)
            return 1
        downloads[local_name] = data

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
    for remote, local in FILES.items():
        html = html.replace(BASE + remote, "/assets/" + local)
    html_path.write_text(html)
    print("Saved all five served photographs byte-for-byte and localized image references. Run npm run build.")
    return 0


if __name__ == "__main__":
    sys.exit(fetch_originals())
