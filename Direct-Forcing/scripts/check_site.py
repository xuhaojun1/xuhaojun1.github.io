"""Validate the static site and its public-only publishing boundary."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.ids.extend([attrs["id"]] if "id" in attrs else [])
        self.links.extend(attrs[key] for key in ("src", "href") if key in attrs)


def main():
    page = (ROOT / "index.html").read_text()
    parser = Links()
    parser.feed(page)
    assert len(parser.ids) == len(set(parser.ids)), "Duplicate HTML ids"
    for link in parser.links:
        parsed = urlsplit(link)
        if not parsed.scheme and parsed.path:
            assert not parsed.path.startswith("/"), link
            assert (ROOT / unquote(parsed.path)).is_file(), link
    gallery = json.loads((ROOT / "data/gallery.json").read_text())
    embedded = (ROOT / "data/gallery-data.js").read_text().split("=", 1)[1].strip().removesuffix(";")
    assert json.loads(embedded) == gallery, "Gallery metadata differs"
    expected = json.loads((ROOT / "site.json").read_text())["selected_videos"]
    assert isinstance(expected, int) and expected > 0
    assert len(gallery) == expected and len({row["id"] for row in gallery}) == expected
    assert [row["order"] for row in gallery] == list(range(1, expected + 1))
    assert gallery[0]["title"] == "A sunset by the sea"
    assert gallery[1]["title"] == "A field of golden flowers"
    for row in gallery:
        for key in ("video", "poster"):
            assert (ROOT / row[key]).is_file(), row[key]
    for key, folder, suffix in (("video", "videos", "*.mp4"), ("poster", "posters", "*.jpg")):
        actual = {str(file.relative_to(ROOT)) for file in (ROOT / "static" / folder).glob(suffix)}
        assert actual == {row[key] for row in gallery}, f"Unreferenced or missing {folder}"
    assert (ROOT / ".nojekyll").is_file()
    for forbidden in ("review", "archive"):
        assert not (ROOT / forbidden).exists(), forbidden
    for file in ROOT.rglob("*"):
        if ".git" in file.relative_to(ROOT).parts or not file.is_file():
            continue
        assert file.name != ".DS_Store", file
        assert file.suffix not in (".pt", ".pth", ".safetensors"), file
        if file.suffix in (".html", ".js", ".json", ".css", ".md"):
            text = file.read_text()
            assert "/Users/" not in text and "/pfs2/" not in text and "/pfs3/" not in text, file
    total = sum(file.stat().st_size for file in (ROOT / "static").rglob("*") if file.is_file())
    print(f"PASS: {expected} ordered videos, local assets, synchronized metadata; static assets {total / 1024**2:.2f} MiB")


if __name__ == "__main__":
    main()
