"""Elbow Method — หาจำนวนคลัสเตอร์ k ที่เหมาะสมก่อนรัน K-Means จริง

รันไฟล์นี้ก่อน ดูกราฟว่าเส้นหักศอกที่ k เท่าไร แล้วค่อยเอาค่านั้นไปใส่
    python clustering.py --k <ค่าที่ได้>

ตัวอย่างการรัน
    python elbow_method.py
    python elbow_method.py --file sample_products.json
    python elbow_method.py --kmax 12 --no-show
"""

from __future__ import annotations

import argparse

import numpy as np

import chart_style as cs
from clustering import plot_elbow, plot_silhouette, sweep_k
from data_source import (
    DEFAULT_FEATURES,
    DEFAULT_URL,
    DataSourceError,
    fetch_products,
    output_dir,
    scale_features,
    to_dataframe,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="หา k ที่เหมาะสมด้วย Elbow Method + Silhouette")
    p.add_argument("--url", default=DEFAULT_URL, help="URL ของ Aggregation API หรือ REST API ตรง ๆ")
    p.add_argument("--file", help="อ่านจากไฟล์ JSON แทนการเรียก API")
    p.add_argument("--days", type=int, help="นับยอดขายเฉพาะ N วันล่าสุด")
    p.add_argument("--features", nargs="+", default=DEFAULT_FEATURES, help="ฟีเจอร์ที่ใช้จัดกลุ่ม")
    p.add_argument("--kmin", type=int, default=2, help="ค่า k ต่ำสุดที่ทดลอง")
    p.add_argument("--kmax", type=int, default=10, help="ค่า k สูงสุดที่ทดลอง")
    p.add_argument("--no-show", action="store_true", help="ไม่ต้องเปิดหน้าต่างกราฟ")
    return p.parse_args()


def knee_point(ks: np.ndarray, inertias: np.ndarray) -> int:
    """หา "ข้อศอก" แบบคำนวณ: จุดที่ห่างจากเส้นตรงหัว-ท้ายของกราฟมากที่สุด"""
    if len(ks) < 3:
        return int(ks[0])

    first = np.array([ks[0], inertias[0]], dtype=float)
    last = np.array([ks[-1], inertias[-1]], dtype=float)
    line = last - first
    line = line / np.linalg.norm(line)

    distances = []
    for k, inertia in zip(ks, inertias):
        point = np.array([k, inertia], dtype=float) - first
        projection = np.dot(point, line) * line
        distances.append(np.linalg.norm(point - projection))

    return int(ks[int(np.argmax(distances))])


def main() -> int:
    args = parse_args()
    cs.apply_style(headless=args.no_show)

    try:
        rows = fetch_products(url=args.url, days=args.days, file=args.file)
        df = to_dataframe(rows, args.features)
    except DataSourceError as exc:
        print(f"[ERROR] {exc}")
        return 1

    if len(df) < 3:
        print(f"[ERROR] มีสินค้าเพียง {len(df)} รายการ ยังหาค่า k ไม่ได้")
        return 1

    scaled, _ = scale_features(df, args.features)
    kmax = max(args.kmin, min(args.kmax, len(df) - 1))
    sweep = sweep_k(scaled, args.kmin, kmax)

    # ข้อศอกคำนวณจากช่วง k ที่ผู้ใช้สนใจเท่านั้น
    window = sweep[sweep["k"] >= args.kmin]
    elbow_k = knee_point(window["k"].to_numpy(), window["inertia"].to_numpy())
    best_sil_k = int(sweep.loc[sweep["silhouette"].idxmax(), "k"])

    print(f"\n=== ผลการทดลองค่า k ({len(df)} สินค้า, ฟีเจอร์: {', '.join(args.features)}) ===")
    print(sweep.round({"inertia": 2, "silhouette": 4}).to_string(index=False))
    print(f"\nElbow (จุดหักศอก)        -> k = {elbow_k}")
    print(f"Silhouette (คะแนนสูงสุด) -> k = {best_sil_k}")
    if elbow_k == best_sil_k:
        print(f"ทั้งสองวิธีตรงกัน ใช้ k = {elbow_k} ได้เลย")
    else:
        print(f"สองวิธีให้คนละค่า ลองรันทั้งสองแบบแล้วเลือกที่อธิบายธุรกิจได้ดีกว่า")
    print(f"\nนำไปใช้ต่อ: python clustering.py --k {best_sil_k}")

    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(13.5, 5.4))
    fig.subplots_adjust(wspace=0.26, top=0.78, bottom=0.14)

    plot_elbow(axes[0], sweep, elbow_k)
    plot_silhouette(axes[1], sweep, best_sil_k)

    fig.suptitle("Choosing the number of clusters (k)", x=0.02, ha="left",
                 fontsize=17, fontweight="bold", color=cs.INK, y=0.97)
    fig.text(0.02, 0.885,
             f"{len(df)} products · features: {', '.join(args.features)} · "
             f"elbow k = {elbow_k} · best silhouette k = {best_sil_k}",
             ha="left", fontsize=10, color=cs.INK_SECONDARY)

    out = output_dir()
    png = out / "elbow_method.png"
    fig.savefig(png, dpi=160)
    sweep.to_csv(out / "k_selection.csv", index=False, encoding="utf-8-sig")
    print(f"\n[SAVED] กราฟ: {png}")

    if not args.no_show:
        plt.show()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
