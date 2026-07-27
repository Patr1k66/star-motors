#!/usr/bin/env python3
"""Parse star-motors.ru price page and generate site-data.json + bot config."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"C:\Users\tim25\.cursor\projects\c-Users-tim25-Desktop-code-chat-bot\agent-tools\8ed39082-996b-4ccc-8935-ed2d4e0d17b2.txt")
if not SOURCE.exists():
    SOURCE = ROOT.parent / "uploads" / "ceny-0.md"

text = SOURCE.read_text(encoding="utf-8")
lines = text.splitlines()

catalog = []
current_category = "Все"
category_map = {
    "ТО (Техническое Обслуживание) Авто": "ТО",
    "Ремонт И Обслуживание Двигателя": "Двигатель",
    "Ремонт Подвески Автомобиля": "Подвеска",
    "Ремонт Привода": "Привод",
    "Ремонт И Обслуживание Тормозной Системы": "Тормоза",
    "Ремонт Рулевого Управления": "Рулевое",
    "Ремонт Электрики И Установка Доп Оборудования": "Электрика",
    "Покраска И Кузовной Ремонт Авто": "Кузов",
    "Чип Тюнинг Авто И Перепрошивка Эбу": "Чип-тюнинг",
    "Шиномонтаж": "Шиномонтаж",
    "Сход развал": "Сход-развал",
    "Ремонт Акпп": "АКПП",
}

for line in lines:
    if line.startswith("## "):
        heading = line[3:].strip()
        current_category = category_map.get(heading, heading)
        continue
    m = re.match(r"^\| (.+?) \| (.+?) \|$", line.strip())
    if not m or m.group(1) in ("Работа", "---"):
        continue
    title, price_raw = m.group(1).strip(), m.group(2).strip()
    if price_raw.lower() == "уточнить":
        price = "уточнить"
    elif price_raw.lower().startswith("от "):
        price = price_raw + " ₽"
    else:
        price = "от " + price_raw + " ₽"
    catalog.append({"title": title, "price": price, "category": current_category})

categories = [{"text": "Все", "slug": "all"}]
seen = set()
for item in catalog:
    if item["category"] not in seen:
        seen.add(item["category"])
        categories.append({"text": item["category"], "slug": item["category"].lower()})

data = {
    "meta": {
        "title": "Star Motors",
        "tagline": "Автосервис для иномарок и китайских автомобилей в Москве",
        "about": "В Star Motors удобно приехать на плановое ТО, диагностику, ремонт двигателя, коробки, подвески, тормозов или электрики. Сначала проверяем причину обращения, затем согласуем работы, сроки и запчасти.",
        "logo": "https://star-motors.ru/wp-content/themes/wordpost_new1/img/logo-1.png",
        "phone": "+7 (495) 995-01-01",
        "ratingValue": "4.7",
        "reviewCount": 128,
        "categoriesText": "Автосервис · ТО · Диагностика · Ремонт",
    },
    "categories": categories,
    "catalog": catalog,
    "reviews": [
        {
            "name": "Андрей В.",
            "date": "июль 2026",
            "text": "Приехал с ошибкой по двигателю — сначала сделали диагностику, объяснили причину и только потом согласовали ремонт. Без навязывания лишнего.",
            "avatar": "https://avatars.mds.yandex.net/get-yapic/47747/0u-9/islands-middle",
            "rating": 5,
        },
        {
            "name": "Марина К.",
            "date": "июнь 2026",
            "text": "Делали ТО и замену масла на китайском кроссовере. Всё по регламенту, смету показали до начала работ. Удобно, что сервис в Строгино.",
            "avatar": "https://avatars.mds.yandex.net/get-yapic/26311/0m-9/islands-middle",
            "rating": 5,
        },
        {
            "name": "Дмитрий С.",
            "date": "май 2026",
            "text": "После ремонта подвески сразу предложили сход-развал. Машина едет ровно, по работам дали понятный список.",
            "avatar": "https://avatars.mds.yandex.net/get-yapic/51169/0c-5/islands-middle",
            "rating": 5,
        },
    ],
    "photos": [
        "https://star-motors.ru/wp-content/uploads/2016/07/1.png",
        "https://star-motors.ru/wp-content/uploads/2016/07/2.png",
        "https://star-motors.ru/wp-content/uploads/2016/07/3.png",
        "https://star-motors.ru/wp-content/uploads/2016/07/4.png",
        "https://star-motors.ru/wp-content/uploads/2016/07/5.png",
    ],
    "features": [
        "Диагностика перед ремонтом",
        "Запчасти под заказ",
        "Гарантия на работы",
        "Европейские, японские, корейские и китайские авто",
        "Техобслуживание",
        "Сход-развал",
        "Шиномонтаж",
        "Кузовной ремонт",
        "Чип-тюнинг",
        "Парковка",
        "Предварительная запись",
    ],
    "legal": {
        "name": 'ООО "СТАР-МОТОРС"',
        "ogrn": "1127746570940",
        "inn": "7734684325",
    },
    "contacts": {
        "phone": "+7 (495) 995-01-01",
        "address": "Москва, район Строгино, ул. Маршала Воробьёва, 8",
        "mapUrl": "https://yandex.ru/maps/?pt=37.3818,55.7933&z=16&l=map",
    },
    "schedule": {
        "status": "Открыто",
        "hours": "пн–пт 9:00–21:00, сб–вс 10:00–21:00",
        "days": [
            {"day": "Понедельник", "hours": "9:00–21:00"},
            {"day": "Вторник", "hours": "9:00–21:00"},
            {"day": "Среда", "hours": "9:00–21:00"},
            {"day": "Четверг", "hours": "9:00–21:00"},
            {"day": "Пятница", "hours": "9:00–21:00"},
            {"day": "Суббота", "hours": "10:00–21:00"},
            {"day": "Воскресенье", "hours": "10:00–21:00"},
        ],
    },
}

(ROOT / "data" / "site-data.json").write_text(
    json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
)

catalog_lines = []
for item in catalog:
    catalog_lines.append(f"- {item['title']} — {item['price']} ({item['category']})")

prompt = f"""Ты — онлайн-консультант автосервиса Star Motors (Стар-Моторс). Помогаешь посетителям понять, какая услуга нужна, сориентировать по ориентировочным ценам и рассказать о сервисе. Ты НЕ записываешь клиентов и НЕ ведёшь бронирование.

Правила поведения (обязательно):
- НИКОГДА не принимай запись, не подтверждай дату или время, не пиши «ждём вас», «записал вас», «готовы вас ждать» и подобное.
- НИКОГДА сам не спрашивай про дату, время или «когда вам удобно».
- Если клиент хочет записаться — не подтверждай запись. Подскажи: запись и точная смета по конкретному авто — по телефону {data['contacts']['phone']}. Нужно назвать марку, модель, год, двигатель и симптомы.
- Твоя задача — консультация: подобрать тип работ, объяснить процесс (диагностика → смета → ремонт), ответить по прайсу, адресу и режиму работы.
- Цены на сайте указаны «от …» и зависят от марки и модели автомобиля — всегда напоминай об этом.
- Не навязывай лишние работы; подход сервиса — сначала причина, потом ремонт.

О компании:
- Название: Star Motors (ООО «СТАР-МОТОРС»)
- Тип: автосервис, техническое обслуживание и ремонт автомобилей
- Адрес: {data['contacts']['address']}
- Телефон: {data['contacts']['phone']}
- Режим работы: {data['schedule']['hours']}
- Район: Строгино, СЗАО (удобно с Куркино, Митино, Крылатское, Тушино)

Принцип работы:
1. Слушаем симптомы (марка, модель, пробег, ошибки, звук, дым, вибрация)
2. Проверяем узел (диагностика, осмотр)
3. Согласуем смету до начала работ
4. После ремонта — проверка и список выполненных работ

Направления:
{chr(10).join('- ' + f for f in data['features'])}

Марки: европейские, японские, корейские и китайские (Haval, Chery, Geely, Changan, Tank, Exeed, Omoda, Jaecoo, Jetour, LiXiang и др.)

Каталог услуг и ориентировочные цены (от):
{chr(10).join(catalog_lines)}

Если клиент спрашивает услугу, которой нет в каталоге, или нужен точный расчёт — предложи позвонить в сервис."""

bot_config = {
    "bot_id": "star-motors",
    "business_name": "Star Motors — автосервис",
    "allowed_domains": [
        "patr1k66.github.io",
        "localhost",
        "127.0.0.1",
    ],
    "system_prompt": prompt,
    "escalation_contact": data["contacts"]["phone"],
    "primary_color": "#1d4ed8",
    "welcome_message": "Здравствуйте! Я онлайн-консультант автосервиса Star Motors. Подскажу, какие работы могут понадобиться, и помогу сориентироваться по ценам — напишите марку авто и что беспокоит.",
}

bot_path = ROOT.parent / "backend" / "clients" / "star-motors.json"
bot_path.write_text(json.dumps(bot_config, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Catalog items: {len(catalog)}")
print("Updated site-data.json and", bot_path)
