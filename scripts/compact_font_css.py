"""
input: Google Fonts-style CSS with repeated variable-font faces per weight
output: equivalent CSS with one weight-range face per source/unicode-range tuple
pos: deterministic font-bundle compactor used by fetch-fonts.sh and asset maintenance
"""
from __future__ import annotations

import pathlib
import re
import sys

FACE_RE = re.compile(r"(?P<comment>/\*[^*]*\*/\s*)?@font-face\s*\{(?P<body>.*?)\}", re.S)
DECL_RE = re.compile(r"^\s*([\w-]+):\s*(.*?);\s*$", re.M)


def parse_face(match: re.Match[str]) -> tuple[str, list[tuple[str, str]], set[int]]:
    declarations = [(key, value.strip()) for key, value in DECL_RE.findall(match["body"])]
    weights = {
        int(value)
        for key, value in declarations
        if key == "font-weight"
        for value in value.split()
    }
    return (match["comment"] or "").strip(), declarations, weights


def render_face(comment: str, declarations: list[tuple[str, str]], weights: set[int]) -> str:
    weight = str(min(weights)) if len(weights) == 1 else f"{min(weights)} {max(weights)}"
    lines = [comment, "@font-face {"] if comment else ["@font-face {"]
    for key, value in declarations:
        lines.append(f"  {key}: {weight if key == 'font-weight' else value};")
    lines.append("}")
    return "\n".join(lines)


def compact_css(css: str) -> str:
    matches = list(FACE_RE.finditer(css))
    if not matches:
        raise ValueError("No @font-face blocks found")
    groups: dict[tuple[tuple[str, str], ...], tuple[str, list[tuple[str, str]], set[int]]] = {}
    for match in matches:
        comment, declarations, weights = parse_face(match)
        key = tuple((name, value) for name, value in declarations if name != "font-weight")
        if key not in groups:
            groups[key] = (comment, declarations, set())
        groups[key][2].update(weights)
    rendered = [render_face(*group) for group in groups.values()]
    return f"{css[:matches[0].start()].rstrip()}\n{chr(10).join(rendered)}\n"


def main() -> None:
    path = pathlib.Path(sys.argv[1])
    before = path.read_text(encoding="utf-8")
    after = compact_css(before)
    path.write_text(after, encoding="utf-8")
    print(f"compacted {len(FACE_RE.findall(before))} faces to {len(FACE_RE.findall(after))}")


if __name__ == "__main__":
    main()
