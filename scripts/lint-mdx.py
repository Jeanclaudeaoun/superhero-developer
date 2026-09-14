#!/usr/bin/env python3
"""Lint the docs tree for the MDX and Nextra mistakes that break `next build`.

Checks, per .mdx file, ignoring fenced code blocks and inline code spans:

  1. Frontmatter `title` / `description` must be present and double-quoted
     (YAML reads an unquoted ": " as a nested mapping and throws).
  2. No bare `{` or `}` — MDX parses them as JavaScript expressions.
  3. No bare `<` followed by a letter, `/` or `!` — MDX parses it as JSX.
  4. No `|` inside an inline code span inside a markdown table row — it splits
     the cell and mangles the table.
  5. No `import` / `export` statements — pages are plain MDX by convention.

Also checks, across the tree:

  6. Every internal link target (`](/foo/bar)`) resolves to a real page.
  7. Every page listed in a directory's _meta.json exists, and every page in a
     directory is listed in its _meta.json.

Usage:  python3 scripts/lint-mdx.py [pages_dir]
Exit code is non-zero when issues are found.
"""

import json
import os
import re
import sys

PAGES = sys.argv[1] if len(sys.argv) > 1 else "pages"

FENCE = re.compile(r"^\s*```")
INLINE_CODE = re.compile(r"`[^`\n]*`")
JSX_OPEN = re.compile(r"<[A-Za-z/!]")
LINK = re.compile(r"\]\((/[^)#\s]*)")
IMPORT = re.compile(r"^\s*(import|export)\s")


def mdx_files():
    for root, _, files in os.walk(PAGES):
        for f in sorted(files):
            if f.endswith(".mdx"):
                yield os.path.join(root, f)


def route_of(path):
    r = path[len(PAGES):]
    r = r[: -len(".mdx")]
    if r.endswith("/index"):
        r = r[: -len("/index")]
    return r or "/"


def check_frontmatter(path, lines, report):
    if not lines or lines[0].strip() != "---":
        report(path, 1, "FRONTMATTER", "file does not start with ---")
        return
    try:
        end = lines.index("---", 1)
    except ValueError:
        report(path, 1, "FRONTMATTER", "unterminated frontmatter block")
        return
    seen = {}
    for i in range(1, end):
        line = lines[i]
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        seen[key.strip()] = (i + 1, value.strip())
    for key in ("title", "description"):
        if key not in seen:
            report(path, 1, "FRONTMATTER", f"missing `{key}`")
            continue
        lineno, value = seen[key]
        if not (value.startswith('"') and value.endswith('"') and len(value) >= 2):
            report(path, lineno, "FRONTMATTER",
                   f"`{key}` must be double-quoted: {value[:60]}")


def check_body(path, lines, report):
    in_fence = False
    in_frontmatter = lines and lines[0].strip() == "---"
    fm_end = None
    if in_frontmatter:
        try:
            fm_end = lines.index("---", 1)
        except ValueError:
            fm_end = 0

    for i, raw in enumerate(lines):
        lineno = i + 1
        if fm_end is not None and i <= fm_end:
            continue
        if FENCE.match(raw):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        if IMPORT.match(raw):
            report(path, lineno, "IMPORT", raw.strip()[:80])

        stripped = INLINE_CODE.sub("", raw)
        if "{" in stripped or "}" in stripped:
            report(path, lineno, "BRACE", raw.strip()[:90])
        if JSX_OPEN.search(stripped):
            report(path, lineno, "ANGLE", raw.strip()[:90])

        if raw.lstrip().startswith("|"):
            for code in INLINE_CODE.findall(raw):
                if "|" in code:
                    report(path, lineno, "TABLE-PIPE", raw.strip()[:90])
                    break


def check_meta(report):
    for root, _, files in os.walk(PAGES):
        if "_meta.json" not in files:
            continue
        meta_path = os.path.join(root, "_meta.json")
        try:
            meta = json.load(open(meta_path))
        except Exception as exc:  # noqa: BLE001
            report(meta_path, 1, "META", f"invalid JSON: {exc}")
            continue
        present = {f[: -len(".mdx")] for f in files if f.endswith(".mdx")}
        present |= {d for d in os.listdir(root)
                    if os.path.isdir(os.path.join(root, d))}
        for key, value in meta.items():
            if key.startswith("--"):
                continue
            if isinstance(value, dict) and value.get("type") == "page" and "href" in value:
                continue
            if key not in present:
                report(meta_path, 1, "META", f"`{key}` listed but no such page")
        for name in sorted(present):
            if name not in meta:
                report(meta_path, 1, "META", f"`{name}` exists but is not in _meta.json")


def main():
    issues = []

    def report(path, lineno, kind, message):
        issues.append(f"{path}:{lineno} {kind}: {message}")

    routes = set()
    files = list(mdx_files())
    for path in files:
        routes.add(route_of(path))

    for path in files:
        text = open(path).read()
        lines = text.split("\n")
        check_frontmatter(path, lines, report)
        check_body(path, lines, report)
        for m in LINK.finditer(text):
            target = m.group(1).rstrip("/") or "/"
            # A trailing file extension means a static asset under public/,
            # not a page route — check it exists on disk instead.
            if re.search(r"\.[A-Za-z0-9]{2,5}$", target):
                if not os.path.isfile(os.path.join("public", target.lstrip("/"))):
                    report(path, text[: m.start()].count("\n") + 1,
                           "ASSET", f"missing file in public/ -> {target}")
                continue
            if target not in routes:
                report(path, text[: m.start()].count("\n") + 1,
                       "LINK", f"broken internal link -> {target}")

    check_meta(report)

    for line in issues:
        print(line)
    print(f"\n{len(issues)} issues across {len(files)} pages")
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
