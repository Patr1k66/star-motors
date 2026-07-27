# Star Motors — демо-сайт с AI-консультантом

Демо на базе **оригинальной вёрстки** [star-motors.ru](https://star-motors.ru/).

**Live:** https://patr1k66.github.io/star-motors/

## Сборка

```bash
python build_data.py   # прайс + конфиг бота
python build_site.py   # index.html из разметки оригинала
```

`build_site.py` берёт header/main/footer с star-motors.ru, подключает их CSS и добавляет секцию цен.
