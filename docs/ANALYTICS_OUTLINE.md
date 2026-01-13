# แนวทางการวิเคราะห์ที่ปลอดภัย (ไม่ใช้การระบุตัวตนจากใบหน้า)

Visualizations
- Timeline per case
- Graph view: โหนด = คดี/หลักฐาน/ยานพาหนะ/สถานที่
- Geospatial heatmap: ความหนาแน่นเหตุการณ์โดยย่าน/เขต

Link Analysis (graph DB)
- โหนด: case, evidence, vehicle, location_zone, device(camera)
- edge types: evidence_of, same_vehicle, same_zone, nearby_time
- confidence score พร้อมแหล่งที่มา

Prioritization / Triage
- rule-based scoring: severity, number_of_evidences, cross-links
- ML (optional): anomaly detection on event volume per zone/time

Non-biometric Vision Analytics
- object detection (vehicle/person silhouette/backpack)
- vehicle attribute extraction (color, type) — ใช้เป็น feature ในการจับคู่เหตุการณ์
- Optional LPR with manual verification
