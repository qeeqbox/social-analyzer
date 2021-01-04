#!/usr/bin/env python3
"""
//  -------------------------------------------------------------
//  author        Giga
//  project       qeeqbox/social-analyzer 
//  email         gigaqeeq@gmail.com
//  description   app.py (CLI)
//  licensee      AGPL-3.0
//  -------------------------------------------------------------
//  contributors list qeeqbox/social-analyzer/graphs/contributors
//  -------------------------------------------------------------
"""

print("[!] Detections are updated every often, make sure to get the most updated ones")

from logging import getLogger, DEBUG, StreamHandler, Formatter
from logging.handlers import RotatingFileHandler
from sys import stdout
from os import path, makedirs
from requests import get
from threading import Thread
from time import time
from argparse import ArgumentParser
from json import load
from uuid import uuid4
from tld import get_fld
from functools import wraps
from bs4 import BeautifulSoup
from queue import Queue

QUEUE = Queue()
USER_AGENT = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0"
PARSED_SITES = []
LOG = getLogger("social-analyzer")

def check_errors(on_off=None):
	def decorator(func):
		@wraps(func)
		def wrapper(*args, **kwargs):
			if on_off:
				try:
					return func(*args, **kwargs)
				except Exception as e:
					pass
					#print(e)
			else:
				return func(*args, **kwargs)
		return wrapper
	return decorator

def msg(name=None):
	return '''app.py -c -m "fast" -u "johndoe" -w "youtube tiktok'''

@check_errors(True)
def setup_logger(uuid=None,file=False):
	if not path.exists("logs"):
		makedirs("logs")
	LOG.setLevel(DEBUG)
	st = StreamHandler(stdout)
	st.setFormatter(Formatter("%(message)s"))
	LOG.addHandler(st)
	if file and uuid:
		fh = RotatingFileHandler("logs/{}".format(uuid))
		fh.setFormatter(Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
		LOG.addHandler(fh)

@check_errors(True)
def init_websites():
	temp_list = []
	with open("sites.json") as f:
		for item in load(f):
			item["selected"] = "false"
			temp_list.append(item)
	return temp_list

def list_all_websites():
	if len(PARSED_SITES) > 0:
		for site in PARSED_SITES:
			x = get_fld(site["url"], fix_protocol=True)
			x = x.replace(".{username}","").replace("{username}.","")
			LOG.info(x)

@check_errors(True)
def find_username_normal(req):

	@check_errors(True)
	def fetch_url(queue, site):
		LOG.info("[Checking] "+ get_fld(site["url"]))
		timeout = site["timeout"] if site["timeout"] != 0 else 10
		implicit = site["implicit"] if site["implicit"] != 0 else 5
		detections_count = 0;
		source = get(site["url"].replace("{username}", req["body"]["string"]), timeout=(implicit, timeout)).text
		text_only = "unavailable";
		title = "unavailable";
		temp_profile = {"found": 0,"image": "","link": "","rate": "","title": "","text": ""};
		for detection in site["detections"]:
			temp_found = "false";
			if detection["type"] == "normal" and source != "" and detection["return"] == "true":
				detections_count += 1
				if detection["string"].replace("{username}", req["body"]["string"]).lower() in source.lower():
					temp_found = "true"
				if detection["return"] == temp_found:
					temp_profile['found'] += 1

		if temp_profile["found"] > 0 and detections_count != 0:
			temp_profile["text"] = "".join(BeautifulSoup(source, "lxml").findAll(text=True))
			if temp_profile["text"] == "":
				temp_profile["text"] = "unavailable"
			temp_profile["title"] = "".join(BeautifulSoup(title, "lxml").findAll(text=True))
			temp_profile["rate"] = "%" + str(round(((temp_profile["found"] / detections_count) * 100), 2))
			temp_profile["link"] = site["url"].replace("{username}", req["body"]["string"]);
			copy_temp_profile = temp_profile.copy()
			queue.put([copy_temp_profile])
		else:
			queue.put(None)

	threads = [Thread(target=fetch_url, args=(QUEUE,site)) for site in PARSED_SITES if site["selected"] == "true"]
	for thread in threads:
		thread.start()
	for thread in threads:
		thread.join()

@check_errors(True)
def check_user_cli(username, websites):
	temp_found = []
	req = {"body": {"uuid": str(uuid4()),"string": username,"option": "FindUserProfilesFast"}}
	setup_logger(req["body"]["uuid"],True)
	for site in PARSED_SITES:
		for temp in websites.split(" "):
			if temp in site["url"]:
				site["selected"] = "true"
	find_username_normal(req)
	while not QUEUE.empty():
		items = QUEUE.get()
		if items != None:
			for item in items:
				if item != None:
					del item['text']
					del item['title']
					del item['image']
					temp_found.append(item)
	if len(temp_found) == 0:
		LOG.info('User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial) in the web app version')
	else:
		for item in temp_found:
			LOG.info(item)

PARSED_SITES = init_websites()
parser = ArgumentParser(description="Qeeqbox/social-analyzer - API and Web App for analyzing & finding a person profile across 300+ social media websites (Detections are updated regularly)",usage=msg())
parser.add_argument("-c","-cli",action="store_true", help="Turn this CLI on")
parser.add_argument("-u","-username", help="E.g. johndoe, john_doe or johndoe9999", metavar="")
parser.add_argument("-w","-website", help="Website or websites separated by space E.g. youtube, tiktok or tumblr", metavar="")
parser.add_argument("-l","-list", action="store_true",  help="List all available websites")
parser.add_argument("-o","-output", help="This option will be implemented..", metavar="")
parser.add_argument("-m","-mode", help="Analysis mode E.g.fast -> FindUserProfilesFast\nslow -> FindUserProfilesSlow\nspecial -> FindUserProfilesSpecial", metavar="")
parsed = parser.parse_args()
if parsed.c:
	if parsed.l:
		setup_logger()
		list_all_websites()
	elif parsed.m == "fast":
		if parsed.u != "" and parsed.w != "":
			check_user_cli(parsed.u,parsed.w)
