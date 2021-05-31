.. image:: https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/readme/socialanalyzerlogo_.png

Social-Analyzer - API, CLI & Web App for analyzing & finding a person's profile across social media websites. It includes different string analysis and detection modules, you can choose which combination of modules to use during the investigation process.

The detection modules utilize a rating mechanism based on different detection techniques, which produces a rate value that starts from 0 to 100 (No-Maybe-Yes). This module intended to have less false positive and it's documented in this `Wiki <https://github.com/qeeqbox/social-analyzer/wiki>`_ link

The analysis and public extracted information from this OSINT tool could help in investigating profiles related to suspicious or malicious activities such as `cyberbullying <https://en.wikipedia.org/wiki/Wikipedia:Cyberbullying>`_, `cybergrooming <https://de.wikipedia.org/wiki/Cyber-Grooming>`_, `cyberstalking <https://en.wikipedia.org/wiki/Cyberstalking>`_, and `spreading misinformation <https://en.wikipedia.org/wiki/Misinformation>`_.

This project is *"currently used by some law enforcement agencies in countries where resources are limited"*.

Update
======
- You can import SocialAnalyzer object from the python package (Users request)
- Cancel task has been implemented (Users request)
- Save the GUI analysis \ output as JSON file has been implemented (Users request)
- For issues and questions related to the private modules, email me directly

So·cial Me·di·a
===============
Websites and applications that enable users to create and share content or to participate in social networking - Oxford Dictionary

Running Example (Simple)
========================
.. code:: bash

    pip3 install social-analyzer
    python3 -m social-analyzer --cli --username "johndoe"

Running Example (Custom)
========================
.. code:: bash

    #install social-analyzer
    pip3 install social-analyzer

    #specific websites
    python3 -m social-analyzer --cli --mode "fast" --username "johndoe" --websites "youtube pinterest tumblr"

    #specific websites with metadata and extraction
    python3 -m social-analyzer --cli --mode "fast" --username "johndoe" --websites "youtube pinterest tumblr" --metadata --extract --trim

    #all websites with metadata, extraction, filter only existing profiles with status good
    python3 -m social-analyzer --cli --mode "fast" --username "johndoe" --websites "all" --metadata --extract --trim --filter "good" --profile "detected"

Running Example (as object)
===========================
.. code:: bash

	from importlib import import_module
	SocialAnalyzer = import_module("social-analyzer").SocialAnalyzer(silent=True)
	results = SocialAnalyzer.run_as_object(username="johndoe",silent=True)
	print(results)

Running Example (as object with specific websites, metadata and extraction)
===========================================================================
.. code:: bash

	from importlib import import_module
	SocialAnalyzer = import_module("social-analyzer").SocialAnalyzer(silent=True)
	results = SocialAnalyzer.run_as_object(username="johndoe", websites="youtube pinterest tumblr", metadata=True, extract=True, silent=True)
	print(results)

Help (python3 -m social-analyzer --h)
=====================================
.. code:: bash

	Qeeqbox/social-analyzer - API and Web App for analyzing & finding a person's
	profile across 300+ social media websites (Detections are updated regularly)

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

Open in Cloud Shell
===================
.. image:: https://img.shields.io/static/v1?label=%3E_&message=Open%20in%20Cloud%20Shell&color=3267d6&style=flat-square
   :target: https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/qeeqbox/social-analyzer&tutorial=README.md

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
- Save the analysis as JSON file
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
- If you want your website to be excluded from this project list, please reach out to me
- This tool meant to be used locally not as a service (It does not have any type of Access Control)
- For issues related to modules that end with -private, reach out directly to me (do not open an issue on GitHub)

Interviews
==========
`Console 37 <https://console.substack.com/p/console-37>`_

Some News\Articles
==================
`5 Open-Source Intelligence (OSINT) GitHub Repositories For Every Security Analyst (Cyber Security) <https://twitter.com/GithubProjects/status/1395205169617547266>`_

Articles
========
`kitploit professionalhackers secnhack meethackers raidforums redpacketsecurity hacking reviews hacking land securityonline skynettools luca-mercatanti pentesttools  anonymousmedia ddosi tenochtitlan-sec modernnetsec haktechs haxf4rall hacker-gadgets mrhacker sector035`
