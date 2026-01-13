<p align="center"> <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png"></p>

Social Analyzer — API, CLI และเว็บแอปสำหรับวิเคราะห์และค้นหาโปรไฟล์บุคคลบนโซเชียลมีเดียกว่า 1,000 แห่ง ซึ่งมีโมดูลการวิเคราะห์และการตรวจจับหลายแบบให้เลือกใช้งาน

ระบบตรวจจับจะใช้กลไกการให้คะแนนที่อาศัยเทคนิคการตรวจจับหลายประเภท ผลลัพธ์เป็นค่าเรตตั้งแต่ 0 ถึง 100 (No-Maybe-Yes) โมดูลนี้ออกแบบมาเพื่อลดผลบวกลวงและเพิ่มความแม่นยำในการตรวจจับ

ข้อมูลวิเคราะห์และข้อมูลสาธารณะที่ดึงจากเครื่องมือ OSINT นี้อาจช่วยการสืบสวนกรณีที่เกี่ยวข้องกับกิจกรรมที่น่าสงสัยหรือเป็นอันตราย เช่น การล่วงละเมิดทางไซเบอร์ การล่อลวง หรือการคุกคามทางอินเทอร์เน็ต

`โปรเจกต์นี้ถูกใช้งานโดยหน่วยงานบังคับใช้กฎหมายบางแห่งในประเทศที่ทรัพยากรจำกัด — ฐานข้อมูลการตรวจจับที่ใช้โดยหน่วยงานเหล่านั้นแตกต่างจากที่เผยแพร่ในที่สาธารณะนี้`

## So·cial Me·di·a
เว็บไซต์และแอปพลิเคชันที่ช่วยให้ผู้ใช้สร้างและแชร์เนื้อหาหรือเข้าร่วมเครือข่ายสังคม — นิยามจาก Oxford Dictionary

## โครงสร้าง
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/structure.png">

## แอป (แนะนำ!)
URL ของเว็บแอปบนเครื่อง: http://0.0.0.0:9005/app.html

<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_fast.gif" style="max-width:768px"/>

## CLI
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/cli.gif" style="max-width:768px"/>

## ฟีเจอร์
- วิเคราะห์สตริงและชื่อ (การจัดหมู่ Permutations และ Combinations)
- ค้นหาโปรไฟล์ด้วยเทคนิคหลากหลาย (ไลบรารี HTTPS และ Webdriver)
- ค้นหาหลายโปรไฟล์พร้อมกัน (ใช้สำหรับการคอร์เรเลชัน — แยกด้วย ",")
- การตรวจจับแบบหลายชั้น (OCR, ปกติ, ขั้นสูง และพิเศษ)
- แสดงข้อมูลโปรไฟล์เชิงภาพโดยใช้ Ixora (เมตาดาต้า & รูปแบบ)
- การสกัดเมตาดาต้าและรูปแบบ (นำมาจาก Qeeqbox OSINT project)
- กราฟแบบ force-directed สำหรับเมตาดาต้า (ต้องเปิดใช้ ExtractPatterns)
- ค้นหาตามอันดับสูงสุดหรือแยกตามประเทศ (Alexa Ranking)
- ค้นหาตามประเภท (เช่น ผู้ใหญ่, ดนตรี ฯลฯ — สถิติอัตโนมัติของเว็บไซต์)
- สถิติและข้อมูลโปรไฟล์พื้นฐาน (หมวดหมู่ ประเทศ)
- สถิติข้ามเมตาดาต้า (นำมาจาก Qeeqbox OSINT project)
- ลดการแสดงผลที่ไม่จำเป็นอัตโนมัติ (เปิดใช้งาน JavaScript เป็นต้น)
- ค้นหาจากเครื่องมือค้นหา (Google API — ทางเลือก)
- คำค้นแบบกำหนดเอง (Google API & DuckDuckGo API — ทางเลือก)
- เก็บภาพหน้าจอของโปรไฟล์ที่ตรวจพบ, title, ข้อมูล และคำอธิบายเว็บไซต์
- หาต้นกำเนิดชื่อ, ความคล้ายของชื่อ & คำที่ใช้บ่อยตามภาษา
- ประมาณอายุของบุคคล (การวิเคราะห์จำกัด)
- กำหนด user-agent, proxy, timeout & implicit wait แบบกำหนดเอง
- รองรับ Python CLI & NodeJS CLI (จำกัดที่ตัวเลือก FindUserProfilesFast)
- ต้องติดตั้ง Chrome เวอร์ชันล่าสุดสำหรับการจับภาพหน้าจอ
- ตัวเลือก grid สำหรับการตรวจสอบที่เร็วขึ้น (จำกัดกับ docker-compose)
- สามารถบันทึก logs ลงโฟลเดอร์หรือแสดงในเทอร์มินัล (รูปแบบสวยงาม)
- ปรับจำนวน worker สำหรับการค้นหา/ดึงโปรไฟล์ได้ (ค่าเริ่มต้น 15)
- ตัวเลือกการตรวจสอบใหม่สำหรับโปรไฟล์ที่ล้มเหลว
- กรองโปรไฟล์ตาม good, maybe และ bad
- บันทึกผลการวิเคราะห์เป็นไฟล์ JSON
- ส่วนติดต่อเว็บและ CLI ที่ใช้งานง่าย
- และอื่นๆ อีกมากมาย!

## การตรวจจับพิเศษ
- Facebook (หมายเลขโทรศัพท์, ชื่อ, หรือชื่อโปรไฟล์)
- Gmail (example@gmail.com)
- Google (example@example.com)

## ติดตั้งและรัน
### Linux (ในรูปแบบ Node WebApp)
```bash
sudo apt-get update
# Depedning on your Linux distro, you may or may not need these 2 lines
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository ppa:mozillateam/ppa -y
sudo apt-get install -y firefox-esr tesseract-ocr git nodejs npm
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm update
npm install
npm start
```

### Linux (ในรูปแบบ Node CLI)
```bash
sudo apt-get update
# Depedning on your Linux distro, you may or may not need these 2 lines
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository ppa:mozillateam/ppa -y
sudo apt-get install -y firefox-esr tesseract-ocr git nodejs npm
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
nodejs app.js --username "johndoe"
#or
nodejs app.js --username "johndoe,janedoe" --metadata
#or
nodejs app.js --username "johndoe,janedoe" --metadata --top 100
#or
nodejs app.js --username "johndoe" --type "adult"
```

### Linux (ในรูปแบบเป็นแพ็กเกจ Python)
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
pip3 install social-analyzer
python3 -m social-analyzer --username "johndoe"
#or
python3 -m social-analyzer --username "johndoe" --metadata
#or
python3 -m social-analyzer --username "johndoe" --metadata --top 100
#or
python3 -m social-analyzer --username "johndoe" --type "adult"
#or
python3 -m social-analyzer --username "johndoe" --websites "car" --logs --screenshots
```

### Linux (เป็นสคริปต์ Python)
```bash
sudo apt-get update
sudo apt-get install git python3 python3-pip
git clone https://github.com/qeeqbox/social-analyzer
cd social-analyzer
pip3 install -r requirements.txt
python3 app.py --username "janedoe"
#or
python3 app.py --username "johndoe" --metadata
#or
python3 app.py --username "johndoe" --metadata --top 100
#or
python3 app.py --username "johndoe" --type "adult"
#or
python3 app.py --username "johndoe" --websites "car" --logs --screenshots
```

### การนำเข้าเป็นออบเจ็กต์ (Python)
```python
# E.g. #1
from importlib import import_module
SocialAnalyzer = import_module("social-analyzer").SocialAnalyzer()
results = SocialAnalyzer.run_as_object(username="johndoe",silent=True)
print(results)

# E.g. #2
from importlib import import_module
SocialAnalyzer = import_module("social-analyzer").SocialAnalyzer()
results = SocialAnalyzer.run_as_object(username="johndoe,janedoe",silent=True,output="json",filter="good",metadata=False,timeout=10, profiles="detected")
print(results)
```

### Linux, Windows, MacOS, Raspberry pi..
- ดูวิธีการติดตั้งเพิ่มเติมได้ที่ [wiki](https://github.com/qeeqbox/social-analyzer/wiki/install)
- ดูการรวมรวม (integration) กับเครื่องมือ OSINT อื่นๆ ได้ที่ [wiki](https://github.com/qeeqbox/social-analyzer/wiki/integration)

## คำสั่งช่วย (social-analyzer --h)
```
Required Arguments:
  --username   E.g. johndoe, john_doe or johndoe9999

Optional Arguments:
  --websites    A website or websites separated by space E.g. youtube, tiktokor tumblr
  --mode        Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial
  --output      Show the output in the following format: json -> json outputfor integration or pretty -> prettify the output
  --options     Show the following when a profile is found: link, rate, titleor text
  --method      find -> show detected profiles, get -> show all profiles regardless detected or not, all -> combine find & get
  --filter      Filter detected profiles by good, maybe or bad, you can do combine them with comma (good,bad) or use all
  --profiles    Filter profiles by detected, unknown or failed, you can do combine them with comma (detected,failed) or use all
  --countries   select websites by country or countries separated by space as: us br ru
  --type        Select websites by type (Adult, Music etc)
  --top         select top websites as 10, 50 etc...[--websites is not needed]
  --extract     Extract profiles, urls & patterns if possible
  --metadata    Extract metadata if possible (pypi QeeqBox OSINT)
  --trim        Trim long strings
  --gui         Reserved for a gui (Not implemented)
  --cli         Reserved for a cli (Not needed)

Listing websites & detections:
  --list        List all available websites

Setting:
  --headers     Headers as dict
  --logs_dir    Change logs directory
  --timeout     Change timeout between each request
  --silent      Disable output to screen
```

## เปิด Shell
[![Open in Cloud Shell](https://img.shields.io/static/v1?label=%3E_&message=Open%20in%20Cloud%20Shell&color=3267d6&style=flat-square)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_gi[...)

## แหล่งข้อมูล
- DuckDuckGo API, Google API, NodeJS, bootstrap, selectize, jQuery, Wikipedia, font-awesome, selenium-webdriver & tesseract.js
- แจ้งผมได้ถ้าผมพลาดการอ้างอิงหรือแหล่งข้อมูลใดๆ!

## ข้อจำกัด/ข้อสังเกต
- ดาวน์โหลดโปรเจกต์นี้จาก GitHub และถือเป็นโครงการด้านความปลอดภัย
- หากต้องการให้เว็บไซต์ของคุณถูกยกเว้นจากรายการโปรเจกต์นี้ กรุณาติดต่อเจ้าของโครงการ
- เครื่องมือนี้ออกแบบให้ใช้งานแบบท้องถิ่น (ไม่ควรใช้เป็นบริการสาธารณะ เนื่องจากไม่มีระบบควบคุมการเข้าถึง)
- สำหรับปัญหาที่เกี่ยวกับโมดูลที่ลงท้ายด้วย -private หรืออยู่ในกลุ่ม private ![](https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/modules.png), ติดต่อผู้ดูแลโดยตรง [...]

## โปรเจกต์อื่นๆ
[![](https://github.com/qeeqbox/.github/blob/main/data/analyzer.png)](https://github.com/qeeqbox/analyzer) [![](https://github.com/qeeqbox/.github/blob/main/data/chameleon.png)](https://github.co[...)
