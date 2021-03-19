.. image:: https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png

Social-Analyzer - API, CLI & Web App for analyzing & finding a person's profile across +300 social media websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation process.

The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes). This module intended to have less false positive and it's documented in this `Wiki <https://github.com/qeeqbox/social-analyzer/wiki>`_ link

The analysis and extracted social media information from this OSINT tool could help in investigating profiles related to suspicious or malicious activities such as `cyberbullying <https://en.wikipedia.org/wiki/Wikipedia:Cyberbullying>`_, `cybergrooming <https://de.wikipedia.org/wiki/Cyber-Grooming>`_, `cyberstalking <https://en.wikipedia.org/wiki/Cyberstalking>`_, and `spreading misinformation <https://en.wikipedia.org/wiki/Misinformation>`_.

This project is *"currently used by some law enforcement agencies in countries where resources are limited"*.

Running Example
===============
.. code:: bash

    pip3 install social-analyzer
    python3 -m social-analyzer --cli --mode "fast" --username "johndoe" --websites "youtube pinterest tumblr" --output "pretty" --metadata --extract --trim

Find Profile CLI (Fast)
=======================
.. image:: https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/cli.gif

Features
========
- String & name analysis
- Find profile using multiple techniques (HTTPS library & Webdriver)
- Multi layers detections (OCR, normal, advanced & special)
- Metadata & Patterns extraction (Added from Qeeqbox osint project)
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
- [Wiki](https://github.com/qeeqbox/social-analyzer/wiki)

Special Detections
==================
- Facebook (Phone number, name or profile name)
- Gmail (example@gmail.com)
- Google (example@example.com)

Running Issues
==============
- Remember that existing profiles show `status:good` or `rate:%100`
- Some websites return `blocked` or `invalid` <- this is the intended behavior
- Use Proxy, VPN, TOR or anything similar for periodic suspicious-profiles checking
- Change the user-agent to most updated one or increase the random time between requests

Resources
=========
- DuckDuckGo API, Google API, NodeJS, bootstrap, selectize, jQuery, Wikipedia, font-awesome, selenium-webdriver & tesseract.js
- Let me know if I missed a reference or resource!

Disclaimer\Notes
================
- Make sure to download this tool from GitHub
- This is a security project (Treat it as a security project)
- If you want your website to be excluded from this project list, please reach out

Interviews
==========
`Console 37 <https://console.substack.com/p/console-37>`_

Articles
========
`kitploit professionalhackers secnhack meethackers raidforums redpacketsecurity hacking reviews hacking land securityonline skynettools luca-mercatanti pentesttools  anonymousmedia ddosi tenochtitlan-sec modernnetsec haktechs haxf4rall hacker-gadgets mrhacker sector035`
