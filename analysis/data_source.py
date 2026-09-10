"""ดึงข้อมูลสินค้าเข้ามาเตรียมทำ K-Means

ลำดับการหาข้อมูล (Flow ตามสไลด์):
    .env -> Private API -> Aggregator -> Combined Dataset -> Clustering

ใช้ร่วมกันทั้ง clustering.py และ elbow_method.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import requests
from dotenv import load_dotenv
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_URL = os.getenv("AGGREGATOR_URL", "http://localhost:6000/api/combined-products")
API_KEY = os.getenv("MEMBER_API_KEY", "")

# ฟีเจอร์ตั้งต้นที่ใช้จัดกลุ่ม: ราคา + สต็อก + ยอดขายจริง
DEFAULT_FEATURES = ["price", "stock", "units_sold"]

# ป้ายกำกับแกนกราฟ (ใช้อังกฤษเพื่อให้อ่านออกทุกเครื่อง)
FEATURE_LABELS = {
    "price": "Price (THB)",
    "stock": "Stock (units)",
    "units_sold": "Units sold",
    "revenue": "Revenue (THB)",
    "inventory_value": "Inventory value (THB)",
    "capacity_mah": "Capacity (mAh)",
    "order_count": "Orders",
}


class DataSourceError(RuntimeError):
    """ดึงข้อมูลไม่สำเร็จ"""


def fetch_products(
    url: str = DEFAULT_URL,
    days: Optional[int] = None,
    file: Optional[str] = None,
    timeout: float = 10.0,
) -> List[Dict[str, Any]]:
    """ดึงรายการสินค้าจาก API (หรือจากไฟล์ JSON เมื่อระบุ --file)"""
    if file:
        path = Path(file)
        if not path.is_absolute():
            path = BASE_DIR / path
        if not path.exists():
            raise DataSourceError(f"ไม่พบไฟล์ {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
    else:
        params = {"days": days} if days else {}
        headers = {"x-api-key": API_KEY} if API_KEY else {}
        try:
            res = requests.get(url, params=params, headers=headers, timeout=timeout)
            res.raise_for_status()
            payload = res.json()
        except Exception as exc:  # noqa: BLE001
            raise DataSourceError(
                f"เรียก {url} ไม่สำเร็จ: {exc}\n"
                "  - ตรวจว่ารัน aggregator.py และ analytics-api.js อยู่หรือยัง\n"
                "  - หรือทดลองด้วยข้อมูลตัวอย่าง: python clustering.py --file sample_products.json"
            ) from exc

    # รองรับทั้ง list ตรง ๆ และ dict ที่ห่อ list ไว้
    if isinstance(payload, dict):
        for key in ("products", "data", "items", "results"):
            if isinstance(payload.get(key), list):
                payload = payload[key]
                break

    if not isinstance(payload, list):
        raise DataSourceError("รูปแบบข้อมูลที่ได้ไม่ใช่ list ของสินค้า")

    return payload


def to_dataframe(rows: List[Dict[str, Any]], features: List[str]) -> pd.DataFrame:
    """แปลงเป็น DataFrame + ทำความสะอาดข้อมูลก่อนเข้าโมเดล"""
    df = pd.DataFrame(rows)
    if df.empty:
        raise DataSourceError("ไม่มีข้อมูลสินค้าเลย (dataset ว่าง)")

    missing = [f for f in features if f not in df.columns]
    if missing:
        raise DataSourceError(
            f"ข้อมูลไม่มีคอลัมน์ {missing} — คอลัมน์ที่มีคือ {sorted(df.columns)}"
        )

    for col in features:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ตัดแถวที่ไม่มีราคา/ฟีเจอร์หลักออก แล้วเติม 0 ให้ช่องว่างที่เหลือ (เช่น ยังไม่เคยขาย)
    before = len(df)
    df = df.dropna(subset=[features[0]]).copy()
    df[features] = df[features].fillna(0)
    dropped = before - len(df)
    if dropped:
        print(f"[INFO] ตัดสินค้าที่ข้อมูล {features[0]} ไม่สมบูรณ์ออก {dropped} รายการ")

    for col in ("name", "source", "model"):
        if col not in df.columns:
            df[col] = ""

    return df.reset_index(drop=True)


def scale_features(df: pd.DataFrame, features: List[str]):
    """Standardization: ทำให้ทุกฟีเจอร์มีน้ำหนักเท่ากันก่อนเข้า K-Means

    จำเป็นมาก เพราะราคาอยู่หลักพัน แต่ยอดขายอยู่หลักหน่วย
    ถ้าไม่ scale ระยะทางจะถูกครอบงำด้วยราคาเพียงอย่างเดียว
    """
    scaler = StandardScaler()
    scaled = scaler.fit_transform(df[features])
    return scaled, scaler


def label_for(feature: str) -> str:
    return FEATURE_LABELS.get(feature, feature.replace("_", " ").title())


def output_dir() -> Path:
    path = BASE_DIR / "output"
    path.mkdir(exist_ok=True)
    return path
