#!/usr/bin/env python3
"""Download Star Motors theme images for offline demo."""
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
THEME = "https://star-motors.ru/wp-content/themes/wordpost_new1/"
UPLOADS = "https://star-motors.ru/wp-content/uploads/2016/07/"

ASSETS = [
    (THEME + "img/bg-black.jpg", ROOT / "img/theme/bg-black.jpg"),
    (THEME + "img/bg-white.jpg", ROOT / "img/theme/bg-white.jpg"),
    (THEME + "images/bg.jpg", ROOT / "img/theme/bg.jpg"),
    (THEME + "img/logo-1.png", ROOT / "img/theme/logo-1.png"),
    (THEME + "img/chekbox.png", ROOT / "img/theme/chekbox.png"),
    (THEME + "img/wheel-black.png", ROOT / "img/theme/wheel-black.png"),
    (THEME + "img/wheel-white.png", ROOT / "img/theme/wheel-white.png"),
]
for i in range(1, 10):
    ASSETS.append((UPLOADS + f"{i}.png", ROOT / f"img/services/{i}.png"))


def fetch(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        print("skip", dest.name)
        return
    print("GET", url)
    data = urllib.request.urlopen(url, timeout=30).read()
    dest.write_bytes(data)


def main() -> None:
    for url, dest in ASSETS:
        fetch(url, dest)
    print("Done.")


if __name__ == "__main__":
    main()
