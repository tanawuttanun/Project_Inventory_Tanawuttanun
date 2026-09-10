"""Group Aggregation API (Central API)

รวมข้อมูลสินค้าจาก REST API ของสมาชิกทุกคนในกลุ่ม (คนละฐานข้อมูลก็ได้
MySQL / PostgreSQL / MongoDB) ให้ออกมาเป็น JSON ชุดเดียวกัน
เพื่อส่งต่อให้สคริปต์ K-Means ใน analysis/clustering.py

รัน:  python aggregator.py
เรียก: GET http://localhost:6000/api/combined-products
       GET http://localhost:6000/api/health
"""

import os
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

PORT = int(os.getenv("AGGREGATOR_PORT", "6000"))
TIMEOUT = float(os.getenv("MEMBER_TIMEOUT", "5"))
MEMBER_API_KEY = os.getenv("MEMBER_API_KEY", "")


def load_members() -> List[Dict[str, str]]:
    """อ่านรายชื่อ API ของสมาชิกจาก .env

    รูปแบบที่รองรับใน MEMBER_APIS (คั่นด้วยเครื่องหมายจุลภาค):
        http://localhost:3021/api/products
        somchai=http://192.168.1.20:5000/api/products
    """
    raw = os.getenv("MEMBER_APIS", "")
    members: List[Dict[str, str]] = []

    for index, item in enumerate(raw.split(","), start=1):
        item = item.strip()
        if not item:
            continue
        if "=" in item and not item.split("=", 1)[0].startswith("http"):
            label, url = item.split("=", 1)
        else:
            label, url = f"member-{index}", item
        members.append({"label": label.strip(), "url": url.strip()})

    return members


MEMBERS = load_members()


def to_number(value: Any) -> Optional[float]:
    """แปลงค่าที่มาจาก API ให้เป็นตัวเลข รองรับทั้ง 1990, "1,990.00" และ "1460 mAh" """
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    match = re.search(r"-?\d+(\.\d+)?", str(value).replace(",", ""))
    return float(match.group()) if match else None


def pick(row: Dict[str, Any], *keys: str) -> Any:
    """ดึงค่าจากคีย์แรกที่เจอ เพราะสมาชิกแต่ละคนอาจตั้งชื่อคอลัมน์ไม่เหมือนกัน"""
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return None


def normalize(row: Dict[str, Any], source: str) -> Optional[Dict[str, Any]]:
    """แปลงข้อมูลดิบของสมาชิกแต่ละคนให้อยู่ในสคีมากลางชุดเดียวกัน"""
    if not isinstance(row, dict):
        return None

    price = to_number(pick(row, "price", "unit_price", "Price", "product_price"))
    stock = to_number(pick(row, "stock", "quantity", "qty", "Stock", "stock_qty"))
    units_sold = to_number(
        pick(row, "units_sold", "sold", "sales", "total_sold", "units", "quantity_sold")
    )
    revenue = to_number(pick(row, "revenue", "total_sales", "sales_amount"))
    capacity = to_number(pick(row, "capacity_mah", "capacity", "capacity_mAh"))

    if price is None:
        # ไม่มีราคา = ใช้ทำ K-Means ไม่ได้ ข้ามแถวนี้ไป
        return None

    price = float(price)
    stock = float(stock) if stock is not None else 0.0
    units_sold = float(units_sold) if units_sold is not None else 0.0

    product_id = pick(row, "id", "_id", "product_id", "sku")

    return {
        "source": row.get("source") or source,
        "id": str(product_id) if product_id is not None else "",
        "name": str(pick(row, "name", "product_name", "title") or "Unknown"),
        "model": str(pick(row, "model", "brand") or "Standard"),
        "capacity_mah": capacity,
        "price": price,
        "stock": stock,
        "units_sold": units_sold,
        "revenue": float(revenue) if revenue is not None else round(price * units_sold, 2),
        "inventory_value": round(price * stock, 2),
    }


def fetch_member(member: Dict[str, str], params: Dict[str, Any]) -> Dict[str, Any]:
    """เรียก API ของสมาชิก 1 คน และแปลงข้อมูลเป็นสคีมากลาง"""
    headers = {"x-api-key": MEMBER_API_KEY} if MEMBER_API_KEY else {}

    try:
        res = requests.get(member["url"], params=params, headers=headers, timeout=TIMEOUT)
        res.raise_for_status()
        payload = res.json()
    except Exception as exc:  # noqa: BLE001 - สมาชิกคนใดล่ม ต้องไม่ทำให้ทั้งกลุ่มล่ม
        print(f"[WARN] {member['label']} -> {exc}")
        return {"label": member["label"], "url": member["url"], "ok": False,
                "error": str(exc), "count": 0, "products": []}

    # รองรับทั้งกรณีตอบเป็น list ตรง ๆ และกรณีห่อไว้ใน key เช่น {"products": [...]}
    if isinstance(payload, dict):
        for key in ("products", "data", "items", "results"):
            if isinstance(payload.get(key), list):
                payload = payload[key]
                break

    if not isinstance(payload, list):
        print(f"[WARN] {member['label']} -> รูปแบบ JSON ไม่ใช่ list")
        return {"label": member["label"], "url": member["url"], "ok": False,
                "error": "unexpected JSON shape", "count": 0, "products": []}

    products = [p for p in (normalize(row, member["label"]) for row in payload) if p]
    print(f"[OK]   {member['label']} -> {len(products)} products")

    return {"label": member["label"], "url": member["url"], "ok": True,
            "error": None, "count": len(products), "products": products}


@app.get("/api/combined-products")
def get_combined_products():
    """รวมสินค้าของสมาชิกทุกคนเป็น dataset เดียว

    ส่ง query param อะไรมา (เช่น ?days=90) จะถูกส่งต่อไปยัง API ของสมาชิกทุกคน
    """
    params = request.args.to_dict()
    combined: List[Dict[str, Any]] = []

    for member in MEMBERS:
        combined.extend(fetch_member(member, params)["products"])

    return jsonify(combined)


@app.get("/api/health")
def get_health():
    """เช็กว่า API ของสมาชิกคนไหนออนไลน์อยู่บ้าง"""
    results = [
        {k: v for k, v in fetch_member(member, {}).items() if k != "products"}
        for member in MEMBERS
    ]
    return jsonify({
        "status": "ok",
        "members": len(MEMBERS),
        "online": sum(1 for r in results if r["ok"]),
        "details": results,
    })


if __name__ == "__main__":
    if not MEMBERS:
        print("[ERROR] ยังไม่ได้ตั้งค่า MEMBER_APIS ใน .env (คัดลอกจาก .env.example)")
    else:
        print(f"Aggregator รวมข้อมูลจาก {len(MEMBERS)} แหล่ง:")
        for m in MEMBERS:
            print(f"  - {m['label']}: {m['url']}")

    app.run(host="0.0.0.0", port=PORT, debug=False)
