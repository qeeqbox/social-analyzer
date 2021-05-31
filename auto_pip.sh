#!/bin/bash
echo "Auto pip Package Creator - QeeqBox"
echo "[x] Deleting pip-social-analyzer"
[[ -d pip-social-analyzer ]] && rm -r pip-social-analyzer
echo "[x] Making pip-social-analyzer"
mkdir -p pip-social-analyzer/social-analyzer
echo "[x] Copying app.py, setup.py, README.rst & README.rst"
cp app.py pip-social-analyzer/social-analyzer/__main__.py
cat >>pip-social-analyzer/social-analyzer/__init__.py <<EOL
#!/usr/bin/env python
from .__main__ import main_logic
from .__main__ import SocialAnalyzer
EOL
cat >>pip-social-analyzer/social-analyzer/social-analyzer <<EOL
#!/usr/bin/env python
from importlib import import_module
if __name__ == '__main__':
	module = import_module("social-analyzer")
	module.main_logic()
EOL
cp setup.py pip-social-analyzer/setup.py
cp README.rst pip-social-analyzer/README.rst
echo "[x] Copying data folder"
cp -r data pip-social-analyzer/social-analyzer/
cd pip-social-analyzer/
echo "[x] Checking setup.py"
python3 setup.py check -r -s
echo "[x] Creating pypi Package"

python3 setup.py sdist bdist_wheel 2>stderr.log 1>stdout.log

 if grep -q "error:" stderr.log
	then
		echo "[x] Creating pypi failed.."
		cat stderr.log
	else
		echo "[x] pypi Package was created successfully"
		read -p "Do you want to upload? (y/n)?" USER_INPUT
		if [ "$USER_INPUT" = "y" ]; then
			echo "[x] Uploading pypi Package"
			twine upload dist/*
		fi
 fi

echo "[x] Cleaning.."
[[ -d pip-social-analyzer ]] && rm -r pip-social-analyzer
echo "[x] Done"
