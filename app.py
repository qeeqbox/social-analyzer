#!/usr/bin/env python

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

from logging import getLogger, DEBUG, Formatter, Handler, addLevelName
from logging.handlers import RotatingFileHandler
from sys import platform, version_info
from os import path, system, makedirs
from time import time, sleep
from argparse import ArgumentParser, SUPPRESS, Namespace
from json import load, dumps, loads
from uuid import uuid4
from functools import wraps
from re import sub as resub
from re import findall, IGNORECASE
from re import compile as recompile
from re import search as research
from contextlib import suppress
from concurrent.futures import ThreadPoolExecutor, as_completed
from random import randint
from tempfile import mkdtemp
from urllib.parse import unquote, urlparse
from urllib3.exceptions import InsecureRequestWarning
from bs4 import BeautifulSoup
from tld import get_fld
from requests import get, packages, Session
from termcolor import colored
from langdetect import detect
from warnings import filterwarnings

filterwarnings('ignore', category=RuntimeWarning, module='runpy')
packages.urllib3.disable_warnings(category=InsecureRequestWarning)


class SocialAnalyzer():
    def __init__(self, silent=False):
        self.websites_entries = []
        self.shared_detections = []
        self.generic_detection = []
        self.log = getLogger("social-analyzer")
        self.sites_path = path.join(path.dirname(__file__), "data", "sites.json")
        self.languages_path = path.join(path.dirname(__file__), "data", "languages.json")
        self.strings_pages = recompile('captcha-info|Please enable cookies|Completing the CAPTCHA', IGNORECASE)
        self.strings_titles = recompile('not found|blocked|attention required|cloudflare', IGNORECASE)
        self.strings_meta = recompile(r'regionsAllowed|width|height|color|rgba\(|charset|viewport|refresh|equiv|robots', IGNORECASE)
        self.languages_json = None
        self.sites_dummy = None
        self.workers = 15
        self.custom_message = 51
        self.timeout = None
        self.waf = True
        self.logs_dir = ''
        self.ret = False
        self.headers = {"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0", }
        self.silent = silent
        self.init_logic()

    def delete_keys(self, in_object, keys):
        '''
        delete specific keys from object
        '''

        for key in keys:
            with suppress(Exception):
                del in_object[key]
        return in_object

    def clean_up_item(self, in_object, keys_str):
        '''
        delete specific keys from object (user input)
        '''

        with suppress(Exception):
            del in_object["image"]
        if keys_str == "" or keys_str is None:
            with suppress(Exception):
                pass
        else:
            for key in in_object.copy():
                if key not in keys_str:
                    with suppress(Exception):
                        del in_object[key]
        return in_object

    def get_language_by_guessing(self, text):
        '''
        guess language by text, this needs long text
        '''

        with suppress(Exception):
            lang = detect(text)
            if lang and lang != "":
                return self.languages_json[lang] + " (Maybe)"
        return "unavailable"

    def get_language_by_parsing(self, source):
        '''
        guess language by parsing the lang tag
        '''

        with suppress(Exception):
            lang = BeautifulSoup(source, "html.parser").find("html", attrs={"lang": True})["lang"]
            if lang and lang != "":
                return self.languages_json[lang]
        return "unavailable"

    def check_errors(self, on_off=None):
        '''
        wrapper function for debugging
        '''

        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if on_off:
                    try:
                        return func(*args, **kwargs)
                    except Exception as err:
                        pass
                        # self.print_wrapper(e)
                else:
                    return func(*args, **kwargs)
            return wrapper
        return decorator

    def setup_logger(self, uuid=None, file=False, argv=None):
        '''
        setup a logger for logs in the temp folder
        '''

        class CustomHandler(Handler):
            '''
            custom stream handler
            '''

            def __init__(self, argv=None, sa_object=None):
                '''
                int, user choices needed
                '''

                Handler.__init__(self)
                self.argv = argv
                self.sa_object = sa_object

            def emit(self, record):
                '''
                emit, based on user choices
                '''

                if self.argv.output != "json" and self.sa_object.silent == False:
                    if record.levelname == "CUSTOM":
                        for item in record.msg:
                            with suppress(Exception):
                                if item == record.msg[0]:
                                    print("-----------------------")
                                for key, value in item.items():
                                    if key == "metadata" or key == "extracted":
                                        if (self.argv.metadata and key == "metadata") or (self.argv.extract and key == "extracted"):
                                            with suppress(Exception):
                                                for idx, _item in enumerate(value):
                                                    empty_string = key + " " + str(idx)
                                                    empty_string = colored(empty_string.ljust(13, ' '), 'blue') + ": "
                                                    for _item_key, _item_value in _item.items():
                                                        if self.argv.trim and _item_key == "content" and len(_item_value) > 50:
                                                            empty_string += "{} : {} ".format(colored(_item_key, 'blue'), colored(_item_value[:50] + "..", 'yellow'))
                                                        else:
                                                            empty_string += "{} : {} ".format(colored(_item_key, 'blue'), colored(_item_value, 'yellow'))
                                                    print("{}".format(empty_string))
                                    else:
                                        print(colored(key.ljust(13, ' '), 'blue'), colored(value, 'yellow'), sep=": ")
                                print("-----------------------")
                    else:
                        print(record.msg)

        if self.logs_dir != '':
            temp_folder = self.logs_dir
        else:
            temp_folder = mkdtemp()
        if argv.output != "json":
            self.print_wrapper('[init] Temporary Logs Directory {}'.format(temp_folder))
        self.log.setLevel(DEBUG)
        self.log.addHandler(CustomHandler(argv, sa_object=self))
        addLevelName(self.custom_message, "CUSTOM")
        if file and uuid:
            fh = RotatingFileHandler(path.join(temp_folder, uuid))
            fh.setFormatter(Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
            self.log.addHandler(fh)

    def init_detections(self, detections):
        '''
        load websites_entries, shared_detections and generic_detection
        '''

        temp_list = []
        with open(self.sites_path, encoding='utf-8') as file:
            for item in load(file)[detections]:
                item["selected"] = "false"
                temp_list.append(item)
        return temp_list

    def sget_website(self, site):
        '''
        extract domain from website
        '''

        temp_value = get_fld(site, fix_protocol=True)
        temp_value = temp_value.replace(".{username}", "").replace("{username}.", "")
        return temp_value

    def list_all_websites(self):
        '''
        list all the available websites' entries
        '''
        if len(self.websites_entries) > 0:
            for site in self.websites_entries:
                temp_value = get_fld(site["url"], fix_protocol=True)
                temp_value = temp_value.replace(".{username}", "").replace("{username}.", "")
                self.log.info(temp_value)

    def fetch_url(self, site, username, options):
        '''
        this runs for every website entry
        '''

        if self.timeout:
            sleep(self.timeout)
        else:
            sleep(randint(1, 99) / 100)

        self.log.info("[Checking] " + get_fld(site["url"]))
        source = ""

        detection_level = {
            "extreme": {
                "fast": "normal",
                "slow": "normal,advanced,ocr",
                "detections": "true",
                "count": 1,
                "found": 2
            },
            "high": {
                "fast": "normal",
                "slow": "normal,advanced,ocr",
                "detections": "true,false",
                "count": 2,
                "found": 1
            },
            "current": "high"
        }

        with suppress(Exception):
            session = Session()
            session.headers.update(self.headers)
            response = session.get(site["url"].replace("{username}", username), timeout=5, verify=False)
            source = response.text
            content = response.content
            answer = dict((k.lower(), v.lower()) for k, v in response.headers.items())
            session.close()
            temp_profile = {}
            temp_detected = {}
            detections_count = 0

            def check_url(url):
                '''
                check if url is okay
                '''

                with suppress(Exception):
                    result = urlparse(url)
                    if result.scheme == "http" or result.scheme == "https":
                        return all([result.scheme, result.netloc])
                return False

            def merge_dicts(temp_dict):
                '''
                '''

                result = {}
                for item in temp_dict:
                    for key, value in item.items():
                        if key in result:
                            result[key] += value
                        else:
                            result[key] = value
                return result

            def detect_logic(detections):
                '''
                check for detections in website entry
                '''

                detections_count = 0
                temp_detected = []
                temp_found = "false"
                temp_profile = {
                    "found": 0,
                    "image": "",
                    "link": "",
                    "rate": "",
                    "status": "",
                    "title": "unavailable",
                    "language": "unavailable",
                    "text": "unavailable",
                    "type": "unavailable",
                    "extracted": "unavailable",
                    "metadata": "unavailable",
                    "good": "",
                    "method": ""
                }

                for detection in detections:
                    temp_found = "false"
                    if detection["type"] in detection_level[detection_level["current"]]["fast"] and source != "":
                        detections_count += 1
                        if detection["string"].replace("{username}", username).lower() in source.lower():
                            temp_found = "true"
                        if detection["return"] == temp_found:
                            temp_profile["found"] += 1
                return temp_profile, temp_detected, detections_count

            def detect():
                '''
                main detect logic
                '''

                temp_profile_all = []
                temp_detected_all = []
                detections_count_all = 0
                for detection in site["detections"]:
                    detections_ = []
                    if detection["type"] == "shared":
                        detections_ = next(item for item in self.shared_detections if item["name"] == detection['name'])
                        if len(detections_) > 0:
                            val1, val2, val3 = detect_logic(detections_["detections"])
                            temp_profile_all.append(val1)
                            detections_count_all += val3

                val1, val2, val3 = detect_logic(site["detections"])
                temp_profile_all.append(val1)
                detections_count_all += val3
                return merge_dicts(temp_profile_all), temp_detected_all, detections_count_all

            temp_profile, temp_detected, detections_count = detect()

            if temp_profile["found"] >= detection_level[detection_level["current"]]["found"] and detections_count >= detection_level[detection_level["current"]]["count"]:
                temp_profile["good"] = "true"

            soup = None

            with suppress(Exception):
                soup = BeautifulSoup(content, "html.parser")

            with suppress(Exception):
                temp_text_arr = []
                temp_text_list = []
                soup = BeautifulSoup(content, "html.parser")
                for item in soup.stripped_strings:
                    if item not in temp_text_list:
                        temp_text_list.append(item)
                        temp_text_arr.append(repr(item).replace("'", ""))
                temp_profile["text"] = " ".join(temp_text_arr)
                temp_profile["text"] = resub(r"\s\s+", " ", temp_profile["text"])
            with suppress(Exception):
                temp_profile["language"] = self.get_language_by_parsing(source)
                if temp_profile["language"] == "unavailable":
                    temp_profile["language"] = self.get_language_by_guessing(temp_profile["text"])
            with suppress(Exception):
                temp_profile["title"] = BeautifulSoup(source, "html.parser").title.string
                temp_profile["title"] = resub(r"\s\s+", " ", temp_profile["title"])

            with suppress(Exception):
                temp_matches = []
                temp_matches_list = []
                if "extract" in site:
                    for item in site["extract"]:
                        matches = findall(item["regex"], source)
                        for match in matches:
                            if item["type"] == "link":
                                if check_url(unquote(match)):
                                    parsed = "{}:({})".format(item["type"], unquote(match))
                                    if parsed not in temp_matches:
                                        temp_matches.append(parsed)
                                        temp_matches_list.append({"name": item["type"], "value": unquote(match)})

                if len(temp_matches_list) > 0:
                    temp_profile["extracted"] = temp_matches_list
                else:
                    del temp_profile["extracted"]

            temp_profile["text"] = temp_profile["text"].replace("\n", "").replace("\t", "").replace("\r", "").strip()
            temp_profile["title"] = temp_profile["title"].replace("\n", "").replace("\t", "").replace("\r", "").strip()

            if temp_profile["text"] == "":
                temp_profile["text"] = "unavailable"
            if temp_profile["title"] == "":
                temp_profile["title"] = "unavailable"

            if self.waf:
                with suppress(Exception):
                    if 'cf-ray' in answer:
                        temp_profile["text"] = "filtered"
                        temp_profile["title"] = "filtered"
                    elif "server" in answer:
                        if "cloudflare" in answer["server"]:
                            temp_profile["text"] = "filtered"
                            temp_profile["title"] = "filtered"
                    if research(self.strings_pages, temp_profile["text"]):
                        temp_profile["text"] = "filtered"
                        temp_profile["title"] = "filtered"
                    if research(self.strings_titles, temp_profile["title"]):
                        temp_profile["text"] = "filtered"
                        temp_profile["title"] = "filtered"

            with suppress(Exception):
                if detections_count != 0:
                    temp_value = round(((temp_profile["found"] / detections_count) * 100), 2)
                    temp_profile["rate"] = "%" + str(temp_value)
                    if temp_value >= 100.00:
                        temp_profile["status"] = "good"
                    elif temp_value >= 50.00 and temp_value < 100.00:
                        temp_profile["status"] = "maybe"
                    else:
                        temp_profile["status"] = "bad"

            # copied from qeeqbox osint (pypi) project (currently in-progress)

            with suppress(Exception):
                if temp_profile["status"] == "good":
                    temp_meta_list = []
                    temp_for_checking = []
                    soup = BeautifulSoup(content, "lxml")
                    for meta in soup.find_all('meta'):
                        if meta not in temp_for_checking and not research(self.strings_meta, str(meta)):
                            temp_for_checking.append(meta)
                            temp_mata_item = {}
                            add = True
                            if meta.has_attr("property"):
                                temp_mata_item.update({"property": meta["property"]})
                            if meta.has_attr("content"):
                                temp_mata_item.update({"content": meta["content"].replace("\n", "").replace("\t", "").replace("\r", "").strip()})
                            if meta.has_attr("itemprop"):
                                temp_mata_item.update({"itemprop": meta["itemprop"]})
                            if meta.has_attr("name"):
                                temp_mata_item.update({"name": meta["name"]})

                            with suppress(Exception):
                                if "property" in temp_mata_item:
                                    for i, item in enumerate(temp_meta_list.copy()):
                                        if "property" in item:
                                            if temp_mata_item["property"] == item["property"]:
                                                temp_meta_list[i]["content"] += ", " + temp_mata_item["content"]
                                                add = False
                                elif "name" in temp_mata_item:
                                    for i, item in enumerate(temp_meta_list.copy()):
                                        if "name" in item:
                                            if temp_mata_item["name"] == item["name"]:
                                                temp_meta_list[i]["content"] += ", " + temp_mata_item["content"]
                                                add = False
                                elif "itemprop" in temp_mata_item:
                                    for i, item in enumerate(temp_meta_list.copy()):
                                        if "itemprop" in item:
                                            if temp_mata_item["itemprop"] == item["itemprop"]:
                                                temp_meta_list[i]["content"] += ", " + temp_mata_item["content"]
                                                add = False

                            if len(temp_mata_item) > 0 and add:
                                temp_meta_list.append(temp_mata_item)

                if len(temp_meta_list) > 0:
                    temp_profile["metadata"] = temp_meta_list

            temp_profile["link"] = site["url"].replace("{username}", username)
            temp_profile["type"] = site["type"]

            if "FindUserProfilesFast" in options and "GetUserProfilesFast" not in options:
                temp_profile["method"] = "find"
            elif "GetUserProfilesFast" in options and "FindUserProfilesFast" not in options:
                temp_profile["method"] = "get"
            elif "FindUserProfilesFast" in options and "GetUserProfilesFast" in options:
                temp_profile["method"] = "all"

            copy_temp_profile = temp_profile.copy()
            return 1, site["url"], copy_temp_profile
        return None, site["url"], []

    def find_username_normal(self, req):
        '''
        main find usernames logic using ThreadPoolExecutor
        '''

        resutls = []

        for i in range(3):
            self.websites_entries[:] = [d for d in self.websites_entries if d.get('selected') == "true"]
            if len(self.websites_entries) > 0:
                with ThreadPoolExecutor(max_workers=self.workers) as executor:
                    future_fetch_url = (executor.submit(self.fetch_url, site, req["body"]["string"], req["body"]["options"]) for site in self.websites_entries)
                    for future in as_completed(future_fetch_url):
                        with suppress(Exception):
                            good, site, data = future.result()
                            if good:
                                self.websites_entries[:] = [d for d in self.websites_entries if d.get('url') != site]
                                resutls.append(data)
                            else:
                                self.log.info("[Waiting to retry] " + self.get_website(site))

        self.websites_entries[:] = [d for d in self.websites_entries if d.get('selected') == "true"]
        if len(self.websites_entries) > 0:
            for site in self.websites_entries:
                temp_profile = {"link": "",
                                "method": "failed"}
                temp_profile["link"] = site["url"].replace("{username}", req["body"]["string"])
                resutls.append(temp_profile)
        return resutls

    def check_user_cli(self, argv):
        '''
        main cli logic
        '''

        temp_detected = {"detected": [], "unknown": [], "failed": []}
        temp_options = "GetUserProfilesFast,FindUserProfilesFast"
        if argv.method != "":
            if argv.method == "find":
                temp_options = "FindUserProfilesFast"
            if argv.method == "get":
                temp_options = "GetUserProfilesFast"

        req = {"body": {"uuid": str(uuid4()), "string": argv.username, "options": temp_options}}
        self.setup_logger(uuid=req["body"]["uuid"], file=True, argv=argv)

        if argv.cli:
            self.log.info("[Warning] --cli is not needed and will be removed later on")

        if argv.websites == "all":
            for site in self.websites_entries:
                site["selected"] = "true"
        else:
            for site in self.websites_entries:
                for temp in argv.websites.split(" "):
                    if temp in site["url"]:
                        site["selected"] = "true"

        resutls = self.find_username_normal(req)

        for item in resutls:
            if item is not None:
                if item["method"] == "all":
                    if item["good"] == "true":
                        item = self.delete_keys(item, ["method", "good"])
                        item = self.clean_up_item(item, argv.options)
                        temp_detected["detected"].append(item)
                    else:
                        item = self.delete_keys(item, ["found", "rate", "status", "method", "good", "text", "extracted", "metadata"])
                        item = self.clean_up_item(item, argv.options)
                        temp_detected["unknown"].append(item)
                elif item["method"] == "find":
                    if item["good"] == "true":
                        item = self.delete_keys(item, ["method", "good"])
                        item = self.clean_up_item(item, argv.options)
                        temp_detected["detected"].append(item)
                elif item["method"] == "get":
                    item = self.delete_keys(item, ["found", "rate", "status", "method", "good", "text", "extracted", "metadata"])
                    item = self.clean_up_item(item, argv.options)
                    temp_detected["unknown"].append(item)
                else:
                    item = self.delete_keys(item, ["found", "rate", "status", "method", "good", "text", "title", "language", "rate", "extracted", "metadata"])
                    item = self.clean_up_item(item, argv.options)
                    temp_detected["failed"].append(item)

        with suppress(Exception):
            if len(temp_detected["detected"]) == 0:
                del temp_detected["detected"]
            else:
                if "all" in argv.profiles or "detected" in argv.profiles:
                    if argv.filter == "all":
                        pass
                    else:
                        temp_detected["detected"] = [item for item in temp_detected["detected"] if item['status'] in argv.filter]
                    if len(temp_detected["detected"]) > 0:
                        temp_detected["detected"] = sorted(temp_detected["detected"], key=lambda k: float(k['rate'].strip('%')), reverse=True)
                    else:
                        del temp_detected["detected"]
                else:
                    del temp_detected["detected"]

            if len(temp_detected["unknown"]) == 0:
                del temp_detected["unknown"]
            else:
                if "all" in argv.profiles or "unknown" in argv.profiles:
                    pass
                else:
                    del temp_detected["unknown"]

            if len(temp_detected["failed"]) == 0:
                del temp_detected["failed"]
            else:
                if "all" in argv.profiles or "failed" in argv.profiles:
                    pass
                else:
                    del temp_detected["failed"]

        if argv.output == "pretty" or argv.output == "":
            if 'detected' in temp_detected:
                self.log.info("[Detected] {} Profile[s]".format(len(temp_detected['detected'])))
                self.log.log(self.custom_message, temp_detected['detected'])
            if 'unknown' in temp_detected:
                self.log.info("[unknown] {} Profile[s]".format(len(temp_detected['unknown'])))
                self.log.log(self.custom_message, temp_detected['unknown'])
            if 'failed' in temp_detected:
                self.log.info("[failed] {} Profile[s]".format(len(temp_detected['failed'])))
                self.log.log(self.custom_message, temp_detected['failed'])

        if argv.output == "json":
            self.print_wrapper(dumps(temp_detected, sort_keys=True, indent=None))

        return temp_detected

    def print_wrapper(self, *args, **kwarg):
        if self.silent == False:
            print(*args, **kwarg)

    def load_file(self, name, path_to_check, url_download):
        ret = None
        try:
            if path.exists(path_to_check) == False:
                self.print_wrapper("[init] Downloading {} from {}".format(name, url_download))
                file = get(url_download, allow_redirects=True)
                with open(path_to_check, 'wb') as f:
                    f.write(file.content)
            if path.exists(path_to_check) == True:
                self.print_wrapper("[init] {} looks good!".format(name))
                with open(path_to_check) as f:
                    ret = load(f)
        except Exception as e:
            self.print_wrapper("[!] {} Does not exist! cannot be downloaded...".format(name))
        return ret

    def init_logic(self):
        self.print_wrapper("[init] Detections are updated very often, make sure to get the most up-to-date ones")
        if platform == "win32":
            system("color")
        makedirs(path.join(path.dirname(__file__), "data"), exist_ok=True)
        self.languages_json = self.load_file("languages.json", self.languages_path, "https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/data/languages.json")
        self.sites_dummy = self.load_file("sites.json", self.sites_path, "https://raw.githubusercontent.com/qeeqbox/social-analyzer/main/data/sites.json")
        self.websites_entries = self.init_detections("websites_entries")
        self.shared_detections = self.init_detections("shared_detections")
        self.generic_detection = self.init_detections("generic_detection")
        if self.languages_json is not None and self.sites_dummy is not None:
            self.print_wrapper("[init] languages.json & sites.json loaded successfully")
        else:
            self.print_wrapper("[init] languages.json & sites.json did not load, exiting..")
            exit()

    def run_as_object(self, cli=False, gui=False, logs_dir='', extract=False, filter='good', headers={}, list=False, metadata=False, method='all', mode='fast', options='', output='pretty', profiles='detected', ret=False, silent=False, timeout=0, trim=False, username='', websites='all'):
        ret = {}
        if logs_dir != '':
            self.logs_dir = logs_dir
        if headers != {}:
            self.headers = headers

        self.timeout = timeout
        self.silent = silent

        _l = locals()
        del _l['self']
        ARGV = Namespace(**_l)
        if ARGV.list:
            self.setup_logger(argv=ARGV)
            self.list_all_websites()
        elif ARGV.mode == "fast":
            if ARGV.username != "" and ARGV.websites != "":
                ret = self.check_user_cli(ARGV)
        return ret

    def run_as_cli(self):

        class _ArgumentParser(ArgumentParser):
            def error(self, message):
                self.exit(2, 'Error: %s\n' % (message))

        ret = {}
        ARGV = None
        ARG_PARSER = _ArgumentParser(description="Qeeqbox/social-analyzer - API and Web App for analyzing & finding a person's profile across 300+ social media websites (Detections are updated regularly)", usage=SUPPRESS)
        ARG_PARSER._action_groups.pop()
        ARG_PARSER_OPTIONAL = ARG_PARSER.add_argument_group("Arguments")
        ARG_PARSER_OPTIONAL.add_argument("--username", help="E.g. johndoe, john_doe or johndoe9999", metavar="", default="")
        ARG_PARSER_OPTIONAL.add_argument("--websites", help="Website or websites separated by space E.g. youtube, tiktok or tumblr", metavar="", default="all")
        ARG_PARSER_OPTIONAL.add_argument("--mode", help="Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial", metavar="", default="fast")
        ARG_PARSER_OPTIONAL.add_argument("--output", help="Show the output in the following format: json -> json output for integration or pretty -> prettify the output", metavar="", default="pretty")
        ARG_PARSER_OPTIONAL.add_argument("--options", help="Show the following when a profile is found: link, rate, title or text", metavar="", default="")
        ARG_PARSER_OPTIONAL.add_argument("--method", help="find -> show detected profiles, get -> show all profiles regardless detected or not, all -> combine find & get", metavar="", default="all")
        ARG_PARSER_OPTIONAL.add_argument("--filter", help="Filter detected profiles by good, maybe or bad, you can do combine them with comma (good,bad) or use all", metavar="", default="good")
        ARG_PARSER_OPTIONAL.add_argument("--profiles", help="Filter profiles by detected, unknown or failed, you can do combine them with comma (detected,failed) or use all", metavar="", default="detected")
        ARG_PARSER_OPTIONAL.add_argument("--extract", help="Extract profiles, urls & patterns if possible", action="store_true")
        ARG_PARSER_OPTIONAL.add_argument("--metadata", help="Extract metadata if possible (pypi QeeqBox OSINT)", action="store_true")
        ARG_PARSER_OPTIONAL.add_argument("--trim", help="Trim long strings", action="store_true")
        ARG_PARSER_OPTIONAL.add_argument("--gui", help="Reserved for a gui (Not implemented)", action="store_true")
        ARG_PARSER_OPTIONAL.add_argument("--cli", help="Reserved for a cli (Not needed)", action="store_true")
        ARG_PARSER_LIST = ARG_PARSER.add_argument_group("Listing websites & detections")
        ARG_PARSER_LIST.add_argument("--list", help="List all available websites", action="store_true")
        ARG_PARSER_SETTINGS = ARG_PARSER.add_argument_group("Setting")
        ARG_PARSER_SETTINGS.add_argument("--headers", help="Headers as dict", metavar="", default={}, type=loads)
        ARG_PARSER_SETTINGS.add_argument("--logs_dir", help="Change logs directory", metavar="", default="")
        ARG_PARSER_SETTINGS.add_argument("--timeout", help="Change timeout between each request", metavar="", type=int, default=0)
        ARG_PARSER_SETTINGS.add_argument("--silent", help="Disable output to screen", action="store_true")
        ARGV = ARG_PARSER.parse_args()

        if ARGV.logs_dir != '':
            self.logs_dir = ARGV.logs_dir
        if ARGV.headers != {}:
            self.headers = ARGV.headers

        self.timeout = ARGV.timeout
        self.silent = ARGV.silent

        if ARGV.list:
            self.setup_logger(argv=ARGV)
            self.list_all_websites()
        elif ARGV.mode == "fast":
            if ARGV.username != "" and ARGV.websites != "":
                ret = self.check_user_cli(ARGV)
        return ret


def main_logic():
    sa = SocialAnalyzer()
    sa.run_as_cli()


if __name__ == "__main__":
    main_logic()
