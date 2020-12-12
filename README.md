<p align="center"> <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo.png"></p>

#
[![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=version&query=$.version&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/changes.md) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=build&query=$.build&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/changes.md) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=test&query=$.test&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/changes.md) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20sites&query=$.websites&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/changes.md) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20detections&query=$.detections&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/changes.md) [![Generic badge](https://img.shields.io/static/v1?label=%F0%9F%91%8D&message=!&color=yellow&style=flat-square)](https://github.com/qeeqbox/social-analyzer/stargazers)

An API for analyzing & finding a person profile across +300 social media websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation. The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes)

If you have a detection, please submit it in a pull request!

```bash
-------------------------------------              ---------------------------------
|        Secuirty Testing           |              |        Social-Analyzer        |
-------------------------------------              ---------------------------------
|   Passive Information Gathering   |     <-->     |   Find Social Media Profiles  |
|                                   |              |                               |
|    Active Information Gathering   |     <-->     |    Post Analysis Activities   |
-------------------------------------              ---------------------------------
```

## Find Profile (Fast - FindUserProflesNormal)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_fast.gif" style="max-width:768px"/>

## Find Profile (Slow - FindUserProflesAdvanced)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_slow.gif" style="max-width:768px"/>


## Features
- String Analysis
- Search Engine Lookup
- Multi Layers detections
- Most Common Names & Words
- Convert Numbers to Letters
- Find Profles Normal (Fast)
- Find Profles Advacned (Slow)
- Profile Screenshot
- And more!

## Install and run (Nodejs + NPM + Firefox)
```bash
add-apt-repository ppa:mozillateam/ppa
apt-get update
apt-get install -y firefox-esr tesseract-ocr
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
npm start
```

## Install and run (docker)
```bash
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
sudo docker build -t social-analyzer . && sudo docker run -p 9005:9005 -it social-analyzer
```

## Resources
- api.duckduckgo, google api, nodejs, bootstrap, selectize, jquery and font-awesome

## Disclaimer\Notes
- This tool meant to be used localy (It does not have any type of Access Control)
