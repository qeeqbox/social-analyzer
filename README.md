<p align="center"> <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png"></p>

#
[![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=version&query=$.version&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=build&query=$.build&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=test&query=$.test&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20sites&query=$.websites&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20detections&query=$.detections&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=special%20detections&query=$.special&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=awaiting%20verification&query=$.awaiting_verification&colorB=orange&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/static/v1?label=%F0%9F%91%8D&message=!&color=yellow&style=flat-square)](https://github.com/qeeqbox/social-analyzer/stargazers)

API and Web App for analyzing & finding a person profile across +300 social media websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation. The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes)

I have been getting requests from all over the place asking me to add a python CLI (I'm working on it) 👍👍👍

**Please submit your contribution in a Pull Request!**

## Updates
- (Testing) Custom user-agent
- (New) Added a small CLI (You can use this project from Command Line, but it's limited to FindUserProflesFast option) 👏
- Added an optional timeout and implicit wait for each detection (Some websites have a delay logic implemented in the backend)
- Added logs (user request)
- Added 5 seconds timeout to https.get (user request)
- Added the API documentation [WiKi](https://github.com/qeeqbox/social-analyzer/wiki)

## Security Testing

```bash
-------------------------------------              ---------------------------------
|        Security Testing           |              |        Social-Analyzer        |
-------------------------------------              ---------------------------------
|   Passive Information Gathering   |     <-->     |   Find Social Media Profiles  |
|                                   |              |                               |
|    Active Information Gathering   |     <-->     |    Post Analysis Activities   |
-------------------------------------              ---------------------------------
```

## Find Profile WEB APP (Fast)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_fast.gif" style="max-width:768px"/>

## Find Profile WEB APP (Slow)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_slow.gif" style="max-width:768px"/>

Profile images **will not** be blurred. If you want them to be blurred, turn that option on

## (New) Find Profile CLI (Fast)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/cli.gif" style="max-width:768px"/>

## Features
- String Analysis
- Search Engine Lookup
- Multi Layers detections
- Most Common Names & Words
- Convert Numbers to Letters
- Find Profles Normal (Fast)
- Find Profles Advacned (Slow)
- Find Profles Special (Slow)
- Profile Screenshot
- And more!

## Special Detections
- facebook

## Install and run as web app (Nodejs + NPM + Firefox)
```bash
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt-get install -y firefox-esr tesseract-ocr git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
rm -rf package-lock.json node_modules
npm install lodash
npm install
npm start
```

## Install and run as cli (Nodejs + NPM + Firefox)
```bash
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt-get install -y firefox-esr tesseract-ocr git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
rm -rf package-lock.json node_modules
npm install lodash
npm install
# If you want to list all websites use node app.js -c -l
# Remember the following runs as FindUserProflesFast
node app.js -c -m "fast" -u "username" -w "youtube pinterest tumblr"
```

## Install and run as web app (docker)
```bash
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
sudo docker build -t social-analyzer . && sudo docker run -p 9005:9005 -it social-analyzer
```

## Running Issues
```
Make sure to update to the latest nodejs and npm
```

## Closing the app by port number
```
sudo kill -9 $(sudo lsof -t -i:9005)
```

## Goals
- Adding the generic websites detections (These need some reviewing, but I will try to add them in 2021)

## Resources
- api.duckduckgo, google api, nodejs, bootstrap, selectize, jquery and font-awesome
- Let me know if i missed a reference or resource!

## Disclaimer\Notes
- This tool meant to be used locally (It does not have any type of Access Control)
- If you want your website to be excluded from this project, please reach out to me!
