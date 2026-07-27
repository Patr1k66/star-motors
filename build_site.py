#!/usr/bin/env python3
"""Assemble demo index.html matching star-motors.ru/ceny/ layout."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EX = ROOT / "_extracted"
SITE_BASE = "/star-motors/"
PAGES_ORIGIN = "https://patr1k66.github.io/star-motors/"

FONT_EXO = (
    "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap"
)
FONT_AWESOME = (
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.3.0/css/font-awesome.min.css"
)
BUNDLE_SOURCES = [
    "reset.css",
    "bootstrap.min.css",
    "menu-image.css",
    "theme.css",
]


def asset(path: str) -> str:
    return f"{SITE_BASE}{path.lstrip('/')}"


def clean_css(text: str) -> str:
    text = text.lstrip("\ufeff").replace("\ufeff", "")
    text = re.sub(r"@charset[^;]+;", "", text)
    text = re.sub(r"@import[^;]+;", "", text)
    return text.strip()


def rewrite_css_urls(text: str) -> str:
    """Point theme assets to GitHub Pages copies."""
    theme_base = f"{PAGES_ORIGIN}img/theme/"
    for prefix in (
        "https://star-motors.ru/wp-content/themes/wordpost_new1/img/",
        "https://star-motors.ru/wp-content/themes/wordpost_new1/images/",
        "//star-motors.ru/wp-content/themes/wordpost_new1/img/",
        "//star-motors.ru/wp-content/themes/wordpost_new1/images/",
    ):
        text = text.replace(prefix, theme_base)
    for i in range(1, 10):
        text = text.replace(
            f"https://star-motors.ru/wp-content/uploads/2016/07/{i}.png",
            f"{PAGES_ORIGIN}img/services/{i}.png",
        )
    # Fix broken quote in some gradient rules
    text = text.replace(
        "voronezh_autoservice11-1024x689.jpg')",
        "voronezh_autoservice11-1024x689.jpg)",
    )
    return text


def bundle_css() -> str:
    parts = [
        rewrite_css_urls(
            clean_css((ROOT / "css" / name).read_text(encoding="utf-8"))
        )
        for name in BUNDLE_SOURCES
    ]
    out = "\n\n".join(parts)
    (ROOT / "css" / "site.bundle.css").write_text(out, encoding="utf-8")
    return out


def build_inline_styles() -> str:
    bundle_css()
    parts = [
        (ROOT / "css" / "site.bundle.css").read_text(encoding="utf-8"),
        (ROOT / "css" / "demo.css").read_text(encoding="utf-8"),
    ]
    return "<style>\n" + "\n".join(parts) + "\n</style>"


def sanitize(html: str) -> str:
    html = re.sub(r'\sonclick="[^"]*"', "", html)
    html = re.sub(r"<noscript>.*?</noscript>", "", html, flags=re.S)
    html = html.replace("</noscript>", "")
    html = re.sub(
        r'src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="',
        "",
        html,
    )
    html = re.sub(
        r"src='data:image/svg\+xml[^']*'",
        "",
        html,
    )
    html = re.sub(
        r'<img([^>]*?)data-src="([^"]+)"([^>]*)>',
        r'<img\1src="\2"\3>',
        html,
    )
    html = re.sub(r'\sclass="[^"]*lazyload[^"]*"', "", html)
    html = re.sub(
        r'<fieldset class="hidden-fields-container">.*?</fieldset>',
        "",
        html,
        flags=re.S,
    )
    html = html.replace('action="/#wpcf7-f10252-o1"', 'action="#"')
    html = html.replace('action="https://star-motors.ru/"', 'action="#"')
    html = html.replace('href="/ceny/"', 'href="#catalog"')
    html = html.replace('href="https://star-motors.ru/ceny/"', 'href="#catalog"')
    html = html.replace('href="/"', 'href="#top"')
    html = re.sub(r"\ssrc=\"\"\s*", " ", html)
    html = html.replace(
        "https://star-motors.ru/wp-content/themes/wordpost_new1/img/logo-1.png",
        f"{PAGES_ORIGIN}img/theme/logo-1.png",
    )
    for i in range(1, 10):
        html = html.replace(
            f"https://star-motors.ru/wp-content/uploads/2016/07/{i}.png",
            f"{PAGES_ORIGIN}img/services/{i}.png",
        )
    html = html.replace(
        'href="https://star-motors.ru/kontakty/" class="accent"',
        'href="https://star-motors.ru/kontakty/"',
    )
    html = html.replace(
        'href="#catalog">Цены</a>',
        'href="#catalog" class="accent">Цены</a>',
    )
    return html


def build_prices_entry_content() -> str:
    data = json.loads((ROOT / "data" / "site-data.json").read_text(encoding="utf-8"))
    section_ids = {
        "ТО": "section-to",
        "Двигатель": "section-engine",
        "Подвеска": "section-suspension",
        "Привод": "section-drive",
        "Тормоза": "section-brake",
        "Рулевое": "section-steering",
        "Электрика": "section-electric",
        "Кузов": "section-body",
        "Чип-тюнинг": "section-chip",
        "Шиномонтаж": "section-tires",
        "Сход-развал": "section-align",
        "АКПП": "section-akpp",
    }
    section_titles = {
        "ТО": "ТО (Техническое Обслуживание) Авто",
        "Двигатель": "Ремонт И Обслуживание Двигателя",
        "Подвеска": "Ремонт Подвески Автомобиля",
        "Привод": "Ремонт Привода",
        "Тормоза": "Ремонт И Обслуживание Тормозной Системы",
        "Рулевое": "Ремонт Рулевого Управления",
        "Электрика": "Ремонт Электрики И Установка Доп Оборудования",
        "Кузов": "Покраска И Кузовной Ремонт Авто",
        "Чип-тюнинг": "Чип Тюнинг Авто И Перепрошивка Эбу",
        "Шиномонтаж": "Шиномонтаж",
        "Сход-развал": "Сход развал",
        "АКПП": "Ремонт Акпп",
    }
    toc = "".join(
        f'<li><a href="#{section_ids[c]}">{section_titles[c]}</a></li>'
        for c in section_ids
    )
    parts = [
        '<div class="entry-content">',
        "<h1>Цены на услуги автотехцентра</h1>",
        "<p>Ниже представлен подробный перечень услуг и ориентировочные цены на работы в нашем автосервисе.</p>",
        f'<div class="toc"><h3>Содержание:</h3><ul>{toc}</ul></div>',
    ]
    by_cat: dict[str, list] = {}
    for item in data["catalog"]:
        by_cat.setdefault(item["category"], []).append(item)
    for cat, sid in section_ids.items():
        items = by_cat.get(cat, [])
        if not items:
            continue
        rows = "".join(
            f"<tr><td>{i['title']}</td><td>{i['price'].replace('от ', 'От ').replace(' ₽', '')}</td></tr>"
            for i in items
        )
        parts.append(f'<h2 id="{sid}">{section_titles[cat]}</h2>')
        parts.append(
            '<table class="price-table table-striped table-bordered tabl" style="width:100%">'
            "<tbody>"
            '<tr><td class="name-col"><strong>Работа</strong></td>'
            '<td class="price-col"><strong>Цена</strong></td></tr>'
            f"{rows}</tbody></table>"
        )
    parts.append(
        "<p><em>* — Ориентировочные цены. Точная смета зависит от марки и модели автомобиля. "
        "Уточнить: +7 (495) 995-01-01</em></p>"
    )
    parts.append('<div class="pagination_list"></div></div>')
    return "\n".join(parts)


def build_ceny_main() -> str:
    content = build_prices_entry_content()
    return f"""<div id="wrapper" class="container">
  <div class="crumb col-xs-12">
    <nav class="kama_breadcrumbs" aria-label="Навигация по сайту">
      <span><a href="#top">Главная</a> » </span>Цены
    </nav>
  </div>
  <div id="main" class="row content">
    <div id="sidebar" class="widget-area col-md-3 col-sm-4 col-xs-12 left-menu">
      <span class="hidden-xs"> </span>
    </div>
    <div class="col-md-9 col-sm-8 col-xs-12 content-block">
      <div id="wordpost_content" class="col-md-12 col-sm-12 col-xs-12">
        <a id="catalog"></a>
        <div id="post-11" class="post-11 page type-page status-publish hentry">
          {content}
          <div class="entry-meta"></div>
        </div>
      </div>
    </div>
  </div>
</div>"""


def main() -> None:
    header = sanitize(EX.joinpath("header.html").read_text(encoding="utf-8"))
    main_html = build_ceny_main()
    footer = sanitize(EX.joinpath("footer.html").read_text(encoding="utf-8"))
    inline_styles = build_inline_styles()

    page = f"""<!DOCTYPE html>
<html lang="ru-RU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="{PAGES_ORIGIN}" />
  <title>Цены — Star Motors, автосервис в Строгино</title>
  <meta name="description" content="Прайс-лист автосервиса Star Motors — ремонт и ТО иномарок в Москве, Строгино." />
  <link rel="icon" href="https://star-motors.ru/wp-content/themes/wordpost_new1/images/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="{FONT_EXO}" rel="stylesheet" />
  <link rel="stylesheet" href="{FONT_AWESOME}" />
  {inline_styles}
</head>
<body class="page page-id-11 wp-theme-wordpost_new1 wordpost" id="top">
{header}
{main_html}
<div class="clear"></div>
{footer}
<p class="demo-note">Демо-копия с AI-консультантом · данные с <a href="https://star-motors.ru/" target="_blank" rel="noopener">star-motors.ru</a></p>
<script src="{PAGES_ORIGIN}js/chat-widget.js" data-bot-id="star-motors" data-api-url="https://chat-bot-api-lovat.vercel.app" data-auto-open-ms="5000" defer></script>
</body>
</html>
"""
    ROOT.joinpath("index.html").write_text(page, encoding="utf-8")
    print("Built index.html (ceny layout) + css/site.bundle.css")


if __name__ == "__main__":
    main()
