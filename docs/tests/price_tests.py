#!/usr/bin/env python3
"""Проверка цен калькуляторов PrintABC против ТЗ.

Запуск:  python3 price_tests.py [--base URL] [--lang he|ru|both] stickers.json catalogs.json
По умолчанию base = тестовый сайт. Для локального запуска: --base http://localhost:5000
Только чтение: шлёт те же запросы, что и страница (GET + POST ?handler=Calculate).
Выход: таблица Markdown; код возврата 1, если есть FAIL.
"""
import argparse, json, re, sys, http.cookiejar, urllib.request, urllib.parse
from decimal import Decimal, ROUND_HALF_UP

DEFAULT_BASE = "https://printabctest-cdc4bde8bjbkc5dd.swedencentral-01.azurewebsites.net"

def session():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def calc(op, url, form):
    html = op.open(url, timeout=30).read().decode("utf-8", "replace")
    m = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', html)
    if not m:
        raise RuntimeError("нет antiforgery-токена на странице")
    data = dict(form, __RequestVerificationToken=m.group(1))
    req = urllib.request.Request(url + "?handler=Calculate", data=urllib.parse.urlencode(data).encode(),
                                 headers={"X-Requested-With": "XMLHttpRequest"})
    try:
        r = op.open(req, timeout=30); return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try: return e.code, json.loads(body)
        except ValueError: return e.code, None

STATUS = {0: "Ready", 1: "ManualQuote", 2: "ValidationError"}
def norm_status(s):
    return STATUS.get(s, s) if isinstance(s, int) else str(s)

def whole(x):
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def check(case, code, js):
    if js is None:
        return "FAIL", f"HTTP {code}, не JSON"
    d = js.get("data") or {}
    st = norm_status(d.get("status")); err = d.get("errorCode") or ""
    inc = d.get("priceIncVatIls"); ex = d.get("priceExVatIls")
    got = f"{st} {err}".strip()
    if inc is not None: got += f" · с НДС {inc}"
    if ex is not None: got += f" · без НДС {ex}"
    if code >= 500: return "FAIL", f"HTTP {code}"
    if st.replace("_", "").lower() != case["status"].replace("_", "").lower():
        return "FAIL", got
    notes = []
    if case["status"] == "ValidationError" and err not in case.get("codes", [err]):
        return "FAIL", got + f" (ждали код {'/'.join(case['codes'])})"
    if "ex" in case and ex is not None and Decimal(str(ex)) != Decimal(str(case["ex"])):
        return "FAIL", got + f" (ждали без НДС {case['ex']})"
    if "show" in case:
        if inc is None: return "FAIL", got + " (нет цены)"
        if whole(inc) != case["show"]:
            return "FAIL", got + f" (клиенту ждали {case['show']} ₪)"
        if Decimal(str(inc)) != Decimal(case["show"]):
            notes.append(f"сервер отдаёт {inc}, клиенту должно быть {case['show']} ₪ — проверить показ")
    return "OK", got + ("; " + "; ".join(notes) if notes else "")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--lang", default="both", choices=["he", "ru", "both"])
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    langs = ["he", "ru"] if a.lang == "both" else [a.lang]
    fails = 0
    for f in a.files:
        spec = json.load(open(f, encoding="utf-8"))
        print(f"\n## {spec['product']} — {a.base}\nИсточник: {spec['source']}\n")
        print("| Тест | Язык | Итог | Получено |\n|---|---|---|---|")
        for case in spec["cases"]:
            for lang in langs:
                url = a.base.rstrip("/") + ("/ru" if lang == "ru" else "") + spec["path"]
                try:
                    code, js = calc(session(), url, dict(spec.get("defaults", {}), **case["form"]))
                    res, got = check(case, code, js)
                except Exception as e:
                    res, got = "FAIL", f"ошибка: {e}"
                fails += res == "FAIL"
                print(f"| {case['id']} | {lang} | {res} | {got} |")
    print(f"\nИтого FAIL: {fails}")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
