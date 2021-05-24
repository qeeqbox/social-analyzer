<p align="center"> <img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png"></p>

#
[![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=version&query=$.version&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20sites&query=$.websites&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=verified%20detections&query=$.detections&colorB=blue&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=pending%20sites&query=$.pending&colorB=orange&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=build&query=$.build&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=test&query=$.test&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/info&label=docker&query=$.docker&colorB=green&style=flat-square)](https://github.com/qeeqbox/social-analyzer/blob/main/info) [![Generic badge](https://img.shields.io/static/v1?label=%F0%9F%91%8D&message=!&color=yellow&style=flat-square)](https://github.com/qeeqbox/social-analyzer/stargazers)

Social Analyzer - API, CLI & Web App for analyzing & finding a person's profile across social media \ websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation process.

The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes). This module intended to have less false positive and it's documented in this [Wiki](https://github.com/qeeqbox/social-analyzer/wiki) link

The analysis and public extracted information from this OSINT tool could help in investigating profiles related to suspicious or malicious activities such as [cyberbullying](https://en.wikipedia.org/wiki/Wikipedia:Cyberbullying), [cybergrooming](https://de.wikipedia.org/wiki/Cyber-Grooming), [cyberstalking](https://en.wikipedia.org/wiki/Cyberstalking), and [spreading misinformation](https://en.wikipedia.org/wiki/Misinformation).

This project is *"currently used by some law enforcement agencies in countries where resources are limited"*.

## Update
- Cancel task has been implemented (Users request)
- Save the GUI analysis \ output as JSON file has been implemented (Users request)
- For issues and questions related to the private modules, email me directly

## So·cial Me·di·a
Websites and applications that enable users to create and share content or to participate in social networking - Oxford Dictionary

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
Standard localhost WEB APP url: http://0.0.0.0:9005/app.html

<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_fast.gif" style="max-width:768px"/>

## Find Profile WEB APP (Slow)
Standard localhost WEB APP url: http://0.0.0.0:9005/app.html

<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/intro_slow.gif" style="max-width:768px"/>

Profile images **will not** be blurred. If you want them to be blurred, turn that option on

## (New) Find Profile CLI (Fast)
<img src="https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/cli.gif" style="max-width:768px"/>

## Features
- String & name analysis (Permutations and Combinations)
- Find profile using multiple techniques (HTTPS library & Webdriver)
- Multi layers detections (OCR, normal, advanced & special)
- Metadata & Patterns extraction (Added from Qeeqbox osint project)
- Force-directed Graph for Metadata (Needs ExtractPatterns)
- Auto-flirtation to unnecessary output
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
- Filter profiles by good, maybe, and bad
- Save the analysis as JSON file
- [Wiki](https://github.com/qeeqbox/social-analyzer/wiki)

## Special Detections
- Facebook (Phone number, name or profile name)
- Gmail (example@gmail.com)
- Google (example@example.com)

## Install and run as NodeJS Web App (Linux + NodeJS + NPM + Firefox)
```bash
# There will be status:good or rate:%100 for existing profiles
# Do not mix FindUserProfilesFast, with FindUserProfilesSlow and ShowUserProfilesSlow

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
add-apt-repository ppa:mozillateam/ppa -y
apt-get install -y firefox-esr tesseract-ocr git nodejs npm
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install
npm start
```

## Install and run as NodeJS Web App (Windows + NodeJS + NPM + Firefox)
```bash
# There will be status:good or rate:%100 for existing profiles
# Do not mix FindUserProfilesFast, with FindUserProfilesSlow and ShowUserProfilesSlow

Download & Install firefox esr (Extended Support Release) from https://www.mozilla.org/en-US/firefox/enterprise/#download
Download & Install https://nodejs.org/en/download/
Download & Extract https://github.com/qeeqbox/social-analyzer/archive/main.zip
cd social-analyzer
npm install
npm start
```

## Install and run as NodeJS Web App with a grid (docker-compose)
```bash
# There will be status:good or rate:%100 for existing profiles

git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
docker-compose -f docker-compose.yml up --build
```

## Install and run as NodeJS Web App (docker)
```bash
# There will be status:good or rate:%100 for existing profiles

git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
docker build -t social-analyzer . && docker run -p 9005:9005 -it social-analyzer
```

## Install and run as Python Module CLI (Windows, Linux, MacOS, Raspberry pi..)
```bash
# You can scan all websites using --websites "all"
# There will be status:good or rate:%100 for existing profiles
# If you want to list all websites use python3 -m social-analyzer --cli --list

#install social-analyzer
pip3 install social-analyzer

#all websites with metadata and extraction
python3 -m social-analyzer --cli --username "johndoe" --metadata --extract --trim

#all websites with metadata, extraction, filter only existing profiles with status good
python3 -m social-analyzer --cli --mode "fast" --username "johndoe" --websites "all" --metadata --extract --trim --filter "good" --profile "detected"
```

## Install and run as Python CLI (Windows, Linux, MacOS, Raspberry pi..)
```bash
# You can scan all websites using --websites "all"
# There will be status:good or rate:%100 for existing profiles
# If you want to list all websites use python3 -m social-analyzer --cli --list

#install social-analyzer
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer

#all websites with metadata and extraction
python3 app.py --cli --username "johndoe" --metadata --extract --trim

#all websites with metadata, extraction, filter only existing profiles with status good
python3 app.py --cli --mode "fast" --username "johndoe" --websites "all" --metadata --extract --trim --filter "good" --profile "detected"
```

## Install and run as NodeJS CLI (Linux + NodeJS + NPM + Firefox)
```bash
# You can scan all websites using --websites "all"
# Remember the following runs as FindUserProfilesFast
# There will be status:good or rate:%100 for existing profiles
# If you want to list all websites use app.js --cli --list

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y software-properties-common
add-apt-repository ppa:mozillateam/ppa -y
apt-get install -y firefox-esr tesseract-ocr git nodejs npm
git clone https://github.com/qeeqbox/social-analyzer.git
cd social-analyzer
npm install

#all websites with metadata and extraction
nodejs app.js --cli --username "johndoe" --metadata --extract --trim

#all websites with metadata, extraction, filter only existing profiles with status good
nodejs app.js --cli --mode "fast" --username "johndoe" --websites "all" --metadata --extract --trim --filter "good" --profile "detected"
```

## social-analyzer --h
```bash
Required Arguments:
  --cli        Turn this CLI on
  --username   E.g. johndoe, john_doe or johndoe9999

Optional Arguments:
  --websites   Website or websites separated by space E.g. youtube, tiktok or tumblr
  --mode       Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial
  --output     Show the output in the following format: json -> json output for integration or pretty -> prettify the output
  --options    Show the following when a profile is found: link, rate, titleor text
  --method     find -> show detected profiles, get -> show all profiles regardless detected or not, both -> combine find & get
  --filter     filter detected profiles by good, maybe or bad, you can do combine them with comma (good,bad) or use all
  --profiles   filter profiles by detected, unknown or failed, you can do combine them with comma (detected,failed) or use all
  --extract    Extract profiles, urls & patterns if possible
  --metadata   Extract metadata if possible (pypi QeeqBox OSINT)
  --trim       Trim long strings

Listing websites & detections:
  --list       List all available websites
```

## Open in Cloud Shell
[![Open in Cloud Shell](https://img.shields.io/static/v1?label=%3E_&message=Open%20in%20Cloud%20Shell&color=3267d6&style=flat-square)](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/qeeqbox/social-analyzer&tutorial=README.md)

## Running Issues
- Remember that existing profiles show `status:good` or `rate:%100`
- Some websites return `blocked` or `invalid` <- this is the intended behavior
- Use Proxy, VPN, TOR or anything similar for periodic suspicious-profiles checking
- Change the user-agent to most updated one or increase the random time between requests
- Use the slow mode (Not available in the CLIs) to avoid running into blocking\results issue

## Goals
- Adding the generic websites detections (These need some reviewing, but I will try to add them in 2021)

## Resources
- DuckDuckGo API, Google API, NodeJS, bootstrap, selectize, jQuery, Wikipedia, font-awesome, selenium-webdriver & tesseract.js
- Let me know if I missed a reference or resource!

## Interviews
- [Console 37](https://console.substack.com/p/console-37)

## Some News\Articles
- [5 Open-Source Intelligence (OSINT) GitHub Repositories For Every Security Analyst (Cyber Security)](https://twitter.com/GithubProjects/status/1395205169617547266)

## Disclaimer\Notes
- Make sure to download this tool from GitHub
- This is a security project (Treat it as a security project)
- If you want your website to be excluded from this project list, please reach out to me
- This tool meant to be used locally not as a service (It does not have any type of Access Control)

## Other Projects
[![](https://github.com/qeeqbox/.github/blob/main/data/analyzer.png)](https://github.com/qeeqbox/analyzer) [![](https://github.com/qeeqbox/.github/blob/main/data/chameleon.png)](https://github.com/qeeqbox/chameleon) [![](https://github.com/qeeqbox/.github/blob/main/data/honeypots.png)](https://github.com/qeeqbox/honeypots) [![](https://github.com/qeeqbox/.github/blob/main/data/osint.png)](https://github.com/qeeqbox/osint) [![](https://github.com/qeeqbox/.github/blob/main/data/url-sandbox.png)](https://github.com/qeeqbox/url-sandbox) [![](https://github.com/qeeqbox/.github/blob/main/data/mitre-visualizer.png)](https://github.com/qeeqbox/mitre-visualizer) [![](https://github.com/qeeqbox/.github/blob/main/data/woodpecker.png)](https://github.com/qeeqbox/woodpecker) [![](https://github.com/qeeqbox/.github/blob/main/data/docker-images.png)](https://github.com/qeeqbox/docker-images) [![](https://github.com/qeeqbox/.github/blob/main/data/seahorse.png)](https://github.com/qeeqbox/seahorse) [![](https://github.com/qeeqbox/.github/blob/main/data/rhino.png)](https://github.com/qeeqbox/rhino)
