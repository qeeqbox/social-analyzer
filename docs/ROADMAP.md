# โครงการ: ระบบวิเคราะห์และช่วยจัดการแฟ้มคดี (ไม่รวมการระบุตัวบุคคลจากใบหน้า)

ภาพรวม
- เป้าหมาย: สร้างระบบช่วยวิเคราะห์แฟ้มหมายจับและพยานหลักฐาน เพื่อช่วยจัดลำดับคดี ค้นรูปแบบพฤติกรรม และเชื่อมโยงข้อมูลระหว่างคดี ด้วยหลักความเป็นส่วนตัวและความปลอดภัย
- ข้อจำกัดสำคัญ: ห้ามออกแบบหรือรวมโมดูลสำหรับระบุตัวบุคคลจากภาพ (face recognition / identity matching) โดยอัตโนมัติ

ฟีเจอร์หลัก
1. Ingestion & normalization ของ metadata (case, evidence, camera metadata)
2. Secure evidence storage (encrypted blobs, fingerprints)
3. Analytics: timeline, geospatial heatmap, link analysis (graph)
4. Triage/priority scoring สำหรับแจกงาน
5. Workflow การขอเข้าดูภาพจริง (justified-access) และ audit logs

Roadmap (ตัวอย่าง)
- Sprint 0 (2w): Audit ข้อมูลและออกแบบสคีมา
- Sprint 1 (3w): Ingest pipeline + secure storage skeleton
- Sprint 2 (4w): Analytics core (time, geo, graph)
- Sprint 3 (3w): UI dashboard prototype + workflows
- Sprint 4 (2w): Security hardening, retention rules, testing with anonymized data