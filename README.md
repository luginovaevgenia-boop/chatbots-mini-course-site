# Лендинг мини-курса по чат-ботам

Одна страница из статичных файлов: `index.html`, `styles.css`, `links.js`. Сборщика нет, страницу можно открыть двойным щелчком по `index.html`.

## Как менять ссылки на кнопках
Откройте `links.js` и замените `"#"` на нужный адрес:

| Ключ | Куда ведёт |
|---|---|
| `freeLessonBot` | Telegram-бот, бесплатный пробный урок |
| `courseBot` | Telegram-бот, оплата курса (7990 ₽) |
| `lessonBot` | Telegram-бот, оплата урока (990 ₽) |
| `offer`, `privacy`, `consentData`, `consentMailing` | юридические страницы |

Пока в ключе стоит `"#"`, кнопка никуда не ведёт.

## Фото и скриншоты
Положите файлы в папку `assets/`. Места под них в `index.html` помечены пунктирными рамками с подписью.

## Проверка
`node tests/site.test.mjs`. С `STRICT=1` проверка падает, если остались незаполненные места `[…]`.

## Юридические страницы
Собираются из markdown командой `python3 tools/build_legal.py <папка с .md>` (нужен `pip install markdown`). Исходники лежат в приватном репозитории, в `docs/legal/`.

## Публикация
Settings → Pages → Deploy from a branch → `main` / root. Адрес: `luginovaevgenia-boop.github.io/chatbots-mini-course-site`.

Перед включением Pages замените заглушки `[…]` и проверьте оферту: на ней стоит плашка «ЧЕРНОВИК».
