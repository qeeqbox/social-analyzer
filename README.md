<p align="center"> <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png"></p>

#
[![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=version&query=$.version&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20sites&query=$.websites&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20detections&query=$.detections&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=special%20detections&query=$.special&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=full%20scan%20time&query=$.full_scan&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=max%20retries&query=$.max_retries&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=awaiting%20verification&query=$.awaiting_verification&colorB=orange&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=build&query=$.build&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=test&query=$.test&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=grid&query=$.grid_test&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=windows&query=$.windows&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=linux&query=$.linux&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=docker&query=$.docker&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/static/v1?label=%F0%9F%91%8D&message=!&color=yellow&style=flat-square)](https://github.com/qeeqbox/social-analyzer/stargazers)

API, CLI & Web App for analyzing & finding a person profile across +300 social media websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation process

The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes)

This project *is currently used by some law enforcement agencies in countries where resources are limited*.

The results from the analysis could help in investigating profiles related to suspicious or malicious activities such as [cyberbullying](https://en.wikipedia.org/wiki/Wikipedia:Cyberbullying), [cybergrooming](https://de.wikipedia.org/wiki/Cyber-Grooming), [cyberstalking](https://en.wikipedia.org/wiki/Cyberstalking), and [spreading misinformation](https://en.wikipedia.org/wiki/Misinformation)

Make sure to download this tool from GitHub - (ONLY) ⚠️  
**All Pull Requests are welcomed!**

## Updates
* API, CLIs & Web App produce:
    * [Detected] -> 0 to 100 (No-Maybe-Yes)
    * [Unknown]  -> Detection did not meet the requirement
    * [Failed]   -> Profile website did not respond

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
- String & name analysis
- Find profile using multiple techniques (HTTPS library & Webdriver)
- Multi layers detections (OCR, normal, advanced & special)
- Search engine lookup (Google API - optional)
- Custom search queries (Google API & DuckDuckGo API - optional)
- Profile screenshot, title, info and website description
- Find name origins, name similarity & common words by language
- Custom user-agent, proxy, timeout & implicit wait
- Python CLI & NodeJS CLI (limited to FindUserProfilesFast option)
- Grid option for faster checking (limited to docker-compose)
- Dump logs to folder or terminal (prettified)
- Adjust finding\getting profile workers (default 15)
- Re-checking option for failed profiles
- [Wiki](https://github.com/qeeqbox/social-analyzer/wiki)

## Special Detections
- Facebook (Phone number, name or profile name)
- Gmail (example@gmail.com)
- Google (example@example.com)

## Install and run as web app (Linux + NodeJS + NPM + Firefox)
```bash
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt-get install -y firefox-esr tesseract-ocr git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install lodash
npm install
npm start
```

## Install and run as web app (Windows + NodeJS + NPM + Firefox)
```bash
Download & Install firfox esr (Extended Support Release) from https://www.mozilla.org/en-US/firefox/enterprise/#download
Download & Install https://nodejs.org/en/download/
Download & Extract https://github.com/qeeqbox/social-analyzer/archive/main.zip
cd social-analyzer
npm install lodash
npm install
npm start
```

## Install and run as CLI (Linux + NodeJS + NPM + Firefox)
```bash
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt-get install -y firefox-esr tesseract-ocr git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install lodash
npm install
# If you want to list all websites use node app.js --cli --list
# Remember the following runs as FindUserProfilesFast
# You can also scan all websites using --websites "all"
node app.js --cli --mode "fast" --username "johndoe" --websites "youtube pinterest tumblr" --output "pretty"
```

## Install and run as CLI (Linux + Python3 + NPM + Firefox)
```bash
sudo add-apt-repository ppa:mozillateam/ppa
sudo apt-get update
sudo apt-get install -y firefox-esr tesseract-ocr git
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
pip3 install lxml BeautifulSoup4 tld pygments langdetect
# If you want to list all websites use python3 app.py --cli --list
# Remember the following runs as FindUserProfilesFast
# You can also scan all websites using --websites "all"
python3 app.py --cli --mode "fast" --username "johndoe" --websites "youtube pinterest tumblr" --output "pretty"
```

## Install and run as web app with a grid (docker-compose)
```bash
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
docker-compose -f docker-compose.yml up --build
```

## Install and run as web app (docker)
```bash
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
docker build -t social-analyzer . && docker run -p 9005:9005 -it social-analyzer
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
- DuckDuckGo API, Google API, NodeJS, bootstrap, selectize, jQuery, Wikipedia, font-awesome, selenium-webdriver & tesseract.js
- Let me know if I missed a reference or resource!

## Disclaimer\Notes
- This tool meant to be used locally (It does not have any type of Access Control)
- If you want your website to be excluded from this project, please reach out

## Interviews
[Console 37](https://console.substack.com/p/console-37?r=3cbez&utm_campaign=post&utm_medium=web&utm_source=osint_subreddit)

## Articles
 kitploit](https://www.kitploit.com/2020/12/social-analyzer-api-and-web-app-for.html) [professionalhackers](https://professionalhackers.in/social-analyzer-api-and-web-app-for-analyzing-and-finding-a-person-profile-across-300-social-media-websites-detections-are-updated-regularly/) [secnhack.in](https://secnhack.in/social-analyzer-analyzing-finding-a-person-profiles/) [meethackers](https://www.meethackers.com/social-media-websites-social-analyzer/) [raidforums](https://raidforums.com/Thread-social-analyzer-An-API-for-analyzing-finding-a-person-profile-across-300-social) [bddung Blog](https://bddung.tistory.com/288) [redpacketsecurity](https://www.redpacketsecurity.com/social-analyzer-api-and-web-app-for-analyzing-and-finding-a-person-profile-across-300-social-media-websites-detections-are-updated-regularly/) [hacking.reviews](https://www.hacking.reviews/2020/12/social-analyzer-api-and-web-app-for.html) [hacking.land](https://www.hacking.land/2020/12/social-analyzer-api-and-web-app-for.html) [securityonline](https://securityonline.info/social-analyzer-api-for-analyzing-finding-a-person-profile-across-300-social-media-websites/) [skynettools](https://skynettools.com/social-analyzer-cross-reference-accounts-over-300-social-media-websites/) [luca-mercatanti](https://luca-mercatanti.com/2021/01/03/social-analyzer-scoprire-tutto-su-una-persona-partendo-dal-nome/) [pentesttools.net](https://pentesttools.net/social-analyzer-finding-a-person-profile-across-300-social-media-sites/)

## Contact
[![Generic badge](https://img.shields.io/badge/slack-@qeeqbox-yellow.svg?logo=slack&style=flat-square)](https://qeeqbox.slack.com/messages/social-analyzer)
