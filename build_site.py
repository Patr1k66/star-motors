#!/usr/bin/env python3
"""Assemble demo index.html from original star-motors.ru markup."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EX = ROOT / "_extracted"

AUTOPTIMIZE_CSS = (
    "https://star-motors.ru/wp-content/cache/autoptimize/css/"
    "autoptimize_single_b2b463a5bdb73833be2a6afbc1843ddd.css"
)
FONT_EXO = (
    "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap"
)


def sanitize(html: str) -> str:
    html = re.sub(r'\sonclick="[^"]*"', "", html)
    html = re.sub(r"<form[^>]*wpcf7[^>]*>.*?</form>", "", html, flags=re.S)
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
    html = html.replace('href="/ceny/"', 'href="#catalog"')
    html = html.replace('href="https://star-motors.ru/ceny/"', 'href="#catalog"')
    html = html.replace('href="/"', 'href="#top"')
    html = html.replace('action="https://star-motors.ru/"', 'action="#"')
    html = re.sub(r"\ssrc=\"\"\s*", " ", html)
    return html


def build_prices_from_data() -> str:
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
        '<section id="catalog" class="sm-home-band sm-home-band--light">',
        '<div class="sm-home-wrap entry-content">',
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
    parts.append("</div></section>")
    return "\n".join(parts)


def main() -> None:
    header = sanitize(EX.joinpath("header.html").read_text(encoding="utf-8"))
    main_html = sanitize(EX.joinpath("main.html").read_text(encoding="utf-8"))
    footer = sanitize(EX.joinpath("footer.html").read_text(encoding="utf-8"))
    prices = build_prices_from_data()

    # inject prices before closing main
    main_html = main_html.replace("</main>", prices + "\n</main>", 1)

    page = f"""<!DOCTYPE html>
<html lang="ru-RU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Star Motors — автосервис в Строгино</title>
  <meta name="description" content="Автосервис Star Motors — ремонт и ТО иномарок в Москве, Строгино." />
  <link rel="icon" href="https://star-motors.ru/wp-content/themes/wordpost_new1/images/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="{FONT_EXO}" rel="stylesheet" />
  <link rel="stylesheet" href="{AUTOPTIMIZE_CSS}" />
  <link rel="stylesheet" href="css/demo.css" />
</head>
<body class="home wp-theme-wordpost_new1 wordpost" id="top">
{header}
{main_html}
<div class="clear"></div>
{footer}
<p class="demo-note">Демо-копия с AI-консультантом · данные с <a href="https://star-motors.ru/" target="_blank" rel="noopener">star-motors.ru</a></p>
<script src="js/chat-widget.js" data-bot-id="star-motors" data-api-url="https://chat-bot-api-lovat.vercel.app" data-auto-open-ms="5000" defer></script>
</body>
</html>
"""
    ROOT.joinpath("index.html").write_text(page, encoding="utf-8")
    print("Built index.html from original Star Motors markup")


if __name__ == "__main__":
    main()
