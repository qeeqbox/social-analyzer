
#!/bin/bash

echo -e "\nQeeqBox Analyzer v$(jq -r '.version' info) starter script -> https://github.com/qeeqbox/analyzer"

setup_requirements () {
	sudo apt update -y
	sudo apt install -y linux-headers-$(uname -r) docker.io jq xdg-utils
	curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
	chmod +x /usr/local/bin/docker-compose
	which docker-compose && echo "Good"
	which docker && echo "Good"
}

wait_on_web_interface () {
until $(curl --silent --head --fail http://127.0.0.1:8000/login/ --output /dev/null); do
sleep 5
done
xdg-open http://127.0.0.1:8000/login
}

dev_project () {
	docker-compose -f docker-compose-dev.yml up --build
}

stop_containers () {
	docker-compose -f docker-compose-test.yml down -v 2>/dev/null
	docker-compose -f docker-compose-dev.yml down -v 2>/dev/null
	docker stop $(docker ps | grep analyzer_ | awk '{print $1}') 2>/dev/null
	docker kill $(docker ps | grep analyzer_ | awk '{print $1}') 2>/dev/null
} 

deploy_aws_project () {
	echo "Will be added later on"
}

auto_configure () {
	stop_containers
	wait_on_web_interface & 
	setup_requirements 
	dev_project 
	stop_containers
	kill %% 2>/dev/null
}

if [[ "$1" == "auto_configure" ]]; then
	stop_containers
	wait_on_web_interface & 
	setup_requirements 
	dev_project 
	stop_containers
fi

kill %% 2>/dev/null

while read -p "`echo -e '\nChoose an option:\n1) Setup requirements (docker, docker-compose)\n9) Run auto configuration\n>> '`"; do
  case $REPLY in
    "1") setup_requirements;;
    "9") auto_configure;;
    *) echo "Invalid option";;
  esac
done
