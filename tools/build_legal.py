"""Собирает юридические страницы из markdown. Запуск: python3 tools/build_legal.py <папка с .md> (нужен пакет markdown)."""
import html, re, sys, pathlib
import markdown

src = pathlib.Path(sys.argv[1])
root = pathlib.Path(__file__).resolve().parent.parent
pages = [("oferta.html", "oferta.md"), ("privacy.html", "privacy.md"),
         ("consent-data.html", "consent-data.md"), ("consent-mailing.html", "consent-mailing.md")]
tpl = '''<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;800&display=swap">
  <link rel="stylesheet" href="legal.css">
</head>
<body>
<main class="doc">
<a class="back" href="index.html">← На страницу курса</a>
{body}
</main>
</body>
</html>
'''
for out, name in pages:
    body = markdown.markdown((src / name).read_text(encoding="utf-8"), extensions=["sane_lists", "nl2br"])
    title = re.sub("<.*?>", "", re.search(r"<h1>(.*?)</h1>", body).group(1)).capitalize()
    (root / out).write_text(tpl.format(title=html.escape(title), body=body), encoding="utf-8")
