#!/usr/bin/python
# -*- coding: utf-8 -*-

from setuptools import setup

with open('README.rst', 'r') as fh:
    long_description = fh.read()

setup(
    name='social-analyzer',
    author='QeeqBox',
    author_email='gigaqeeq@gmail.com',
    description="API, CLI & Web App for analyzing & finding a person's profile across 300+ social media websites (Detections are updated regularly)",
    long_description=long_description,
    version='0.8',
    license='AGPL-3.0',
    url='https://github.com/qeeqbox/social-analyzer',
    packages=['social-analyzer'],
    include_package_data=True,
    entry_points={'console_scripts': ['social_analyzer = social_analyzer.__main__:main']},
    install_requires=['BeautifulSoup4', 'tld', 'termcolor', 'langdetect', 'requests'],
    package_data={'social-analyzer': ['data/*']},
    python_requires='>=3',
    )
