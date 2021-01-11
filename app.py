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

from logging import getLogger, DEBUG, StreamHandler, Formatter
from logging.handlers import RotatingFileHandler
from contextlib import contextmanager
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
from json import dumps
from queue import Queue
from pygments import highlight, lexers, formatters
from re import sub as resub

QUEUE = Queue()
USER_AGENT = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0"
PARSED_SITES = []
LOG = getLogger("social-analyzer")

@contextmanager
def ignore_excpetion(*exceptions):
	'''
	catch excpetion
	'''
	try:
		yield
	except exceptions as error:
		#print("{} {} {}".format(datetime.utcnow(), EXCLAMATION_MARK, error))
		pass

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
def find_username_normal(req, options):

	@check_errors(True)
	def fetch_url(queue, site, options):
		if options.output != "json":
			LOG.info("[Checking] "+ get_fld(site["url"]))
		timeout = site["timeout"] if site["timeout"] != 0 else 10
		implicit = site["implicit"] if site["implicit"] != 0 else 5
		detections_count = 0;
		source = get(site["url"].replace("{username}", req["body"]["string"]), timeout=(implicit, timeout)).text
		text_only = "unavailable";
		title = "unavailable";
		temp_profile = {"found": 0,"link": "","rate": "","title": "","text": ""};
		for detection in site["detections"]:
			temp_found = "false";
			if detection["type"] == "normal" and source != "" and detection["return"] == "true":
				detections_count += 1
				if detection["string"].replace("{username}", req["body"]["string"]).lower() in source.lower():
					temp_found = "true"
				if detection["return"] == temp_found:
					temp_profile['found'] += 1

		if temp_profile["found"] > 0 and detections_count != 0:
			with ignore_excpetion():
				soup = BeautifulSoup(source, 'html.parser')
				[tag.extract() for tag in soup(['head', 'title','style', 'script', '[document]'])]
				temp_profile["text"] = soup.getText()
				temp_profile["text"] = resub("\s\s+", " ", temp_profile["text"])
				temp_profile["text"] = temp_profile["text"].replace("\n", "").replace("\t", "").replace("\r", "").strip()
			with ignore_excpetion():
				temp_profile["title"] = BeautifulSoup(source, 'html.parser').title.string
				temp_profile["title"] = resub("\s\s+", " ", temp_profile["title"])
				temp_profile["title"] = temp_profile["title"].replace("\n", "").replace("\t", "").replace("\r", "").strip()
			if temp_profile["text"] == "":
				temp_profile["text"] = "unavailable"
			if temp_profile["title"] == "":
				temp_profile["title"] = "unavailable"
			temp_profile["rate"] = "%" + str(round(((temp_profile["found"] / detections_count) * 100), 2))
			temp_profile["link"] = site["url"].replace("{username}", req["body"]["string"]);
			copy_temp_profile = temp_profile.copy()
			queue.put([copy_temp_profile])
		else:
			queue.put(None)

	threads = [Thread(target=fetch_url, args=(QUEUE,site,options)) for site in PARSED_SITES if site["selected"] == "true"]
	for thread in threads:
		thread.start()
	for thread in threads:
		thread.join()

@check_errors(True)
def check_user_cli(parsed):
	temp_found = []
	temp_keys = {"found": 0,"link": "","rate": "","title": "","text": ""};
	req = {"body": {"uuid": str(uuid4()),"string": parsed.username,"option": "FindUserProfilesFast"}}
	setup_logger(req["body"]["uuid"],True)

	if parsed.websites == "all":
		for site in PARSED_SITES:
			site["selected"] = "true"
	else:
		for site in PARSED_SITES:
			for temp in parsed.websites.split(" "):
				if temp in site["url"]:
					site["selected"] = "true"
	find_username_normal(req, parsed)
	while not QUEUE.empty():
		items = QUEUE.get()
		if items != None:
			for item in items:
				if item != None:
					if parsed.options == "" or parsed.options == None:
						del item['text']
					else:
						for key in temp_keys:
							if key not in parsed.options:
								with ignore_excpetion():
									del item[key]
					temp_found.append(item)
	if len(temp_found) == 0:
		if parsed.output != "json":
			LOG.info('User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial) in the web app version')
	else:
		if parsed.output == "json":
			print(dumps(temp_found, sort_keys=True, indent=None))
		elif parsed.output == "pretty":
			LOG.info('[Total Profiles Found] {}\n'.format(len(temp_found)))
			for item in temp_found:
				LOG.info(highlight(dumps(item, sort_keys=True, indent=4), lexers.JsonLexer(), formatters.TerminalFormatter()))
		else:
			LOG.info('[Total Profiles Found ] {}\n'.format(len(temp_found)))
			for item in temp_found:
				LOG.info(item)

def msg(name=None):
	return '''app.py --cli --mode "fast" --username "johndoe" --websites "youtube tiktok"'''

PARSED_SITES = init_websites()
arg_parser = ArgumentParser(description="Qeeqbox/social-analyzer - API and Web App for analyzing & finding a person profile across 300+ social media websites (Detections are updated regularly)",usage=msg())
arg_parser._action_groups.pop()
arg_parser_required = arg_parser.add_argument_group('Required Arguments')
arg_parser_required.add_argument("--cli",action="store_true", help="Turn this CLI on", required=True)
arg_parser_required.add_argument("--username", help="E.g. johndoe, john_doe or johndoe9999", metavar="", required=True)
arg_parser_required.add_argument("--websites", help="Website or websites separated by space E.g. youtube, tiktok or tumblr", metavar="" ,required=True)
arg_parser_required.add_argument("--mode", help="Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial", metavar="", required=True)
arg_parser_optional = arg_parser.add_argument_group('Optional Arguments')
arg_parser_optional.add_argument("--output", help="Show the output in the following format: json -> json output for integration or pretty -> prettify the output", metavar="", default="")
arg_parser_optional.add_argument("--options", help="Show the following when a profile is found: link, rate, title or text", metavar="", default="")
arg_parser_list = arg_parser.add_argument_group('Listing websites & detections')
arg_parser_list.add_argument("--list", action="store_true",  help="List all available websites")
parsed = arg_parser.parse_args()

if parsed.output != "json":
	print("[!] Detections are updated every often, make sure to get the most updated ones")

if parsed.cli:
	if parsed.list:
		setup_logger()
		list_all_websites()
	elif parsed.mode == "fast":
		if parsed.username != "" and parsed.websites != "":
			check_user_cli(parsed)
