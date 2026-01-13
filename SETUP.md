# `SETUP.md` — Social Analyzer Installation Guide

<p align="center">
  <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png" width="300">
</p>

**Social Analyzer** — API, CLI, and Web App for analyzing & finding profiles across +1000 social media websites.

This guide explains how to **install and run Social Analyzer** on Linux, Windows, macOS, and Raspberry Pi.

---

## 1. Prerequisites

- **Node.js** ≥ 18.x
- **npm** (comes with Node.js)
- **Python 3.x** + pip (for Python CLI support)
- **Firefox** (or Chrome for WebDriver screenshots)
- **Tesseract OCR** (for OCR-based detection modules)
- Optional: **Docker** (for containerized execution)

---

## 2. Linux Installation

### a. Node.js Web App

```bash
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
sudo add-apt-repository ppa:mozillateam/ppa -y
sudo apt-get install -y firefox-esr tesseract-ocr git nodejs npm

git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer

npm update
npm install
npm start
```

- Access the web app at: [http://0.0.0.0:9005/app.html](http://0.0.0.0:9005/app.html)

### b. Node.js CLI

```bash
npm install
nodejs app.js --username "johndoe"
# Options:
# --metadata : extract metadata
# --top 100  : limit to top 100 websites
# --type "adult" : search by website category
```

### c. Python Package

```bash
pip3 install social-analyzer
python3 -m social-analyzer --username "johndoe"
```

### d. Python Script

```bash
git clone https://github.com/qeeqbox/social-analyzer
cd social-analyzer
pip3 install -r requirements.txt

python3 app.py --username "johndoe"
```

---

## 3. Windows Installation

- Install [Node.js](https://nodejs.org/) and Python 3.x
- Install **Firefox** or **Chrome** for WebDriver
- Install **Tesseract OCR**: [https://github.com/tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract)
- Clone the repo:

```powershell
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
node app.js --username "johndoe"
```

---

## 4. macOS Installation

```bash
brew update
brew install node python3 tesseract firefox git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
node app.js --username "johndoe"
```

---

## 5. Raspberry Pi Installation

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm python3 python3-pip git tesseract-ocr firefox-esr
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
node app.js --username "johndoe"
```

---

## 6. Running Options

| Command Option | Description                                   |
| -------------- | --------------------------------------------- |
| `--username`   | Required: e.g., johndoe, johndoe,janedoe      |
| `--websites`   | List specific websites: youtube tiktok tumblr |
| `--mode`       | Analysis mode: fast, slow, special            |
| `--output`     | `json` or `pretty` output                     |
| `--metadata`   | Extract metadata if possible                  |
| `--top`        | Limit top N websites                          |
| `--type`       | Filter websites by category                   |
| `--filter`     | Filter by `good`, `maybe`, `bad`              |
| `--profiles`   | Filter profiles by detected/failed/unknown    |

> See `social-analyzer --h` for full CLI help.

---

## 7. Troubleshooting

- **Node version issues:** Ensure Node.js ≥18.x
- **Python errors:** Check `pip3` and correct Python version
- **Permission errors:** Use `sudo` on Linux/Mac or run PowerShell as Admin on Windows
- **Missing Firefox/Chrome:** Required for WebDriver screenshots
- **Tesseract OCR issues:** Ensure it's installed and accessible in PATH

---

## 8. Additional Resources

- Wiki for integration: [https://github.com/qeeqbox/social-analyzer/wiki/integration](https://github.com/qeeqbox/social-analyzer/wiki/integration)
- Wiki for full installation methods: [https://github.com/qeeqbox/social-analyzer/wiki/install](https://github.com/qeeqbox/social-analyzer/wiki/install)

---
