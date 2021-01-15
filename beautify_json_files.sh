#!/bin/sh

#qeeqbox/social-analyzer
#Please use this cleaner & formatter script after adding detections

echo "[Cleaning] sites.json"
tmp_file=$(mktemp)
cat sites.json | jq 'sort_by(.url)' > $tmp_file
cat $tmp_file > sites.json
rm -f $tmp_file
echo "[Done] sites.json"

echo "[Cleaning] names.json"
tmp_file=$(mktemp)
cat names.json | jq . > $tmp_file
cat $tmp_file > names.json
rm -f $tmp_file
echo "[Done] names.json"

echo "[Cleaning] dict.json"
tmp_file=$(mktemp)
cat dict.json | jq . > $tmp_file
cat $tmp_file > dict.json
rm -f $tmp_file
echo "[Done] dict.json"
