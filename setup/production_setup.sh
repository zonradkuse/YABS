#!/bin/bash
set -e
# Init
SERVICE_IDENTIFIER="yabs"
NEWUSER="yabs"
NODE="/usr/bin/nodejs"
EXEC="server.js"
WORKING_DIRECTORY="/opt/nodejs/yabs"
FILE="/tmp/out.$$"
TARGET_SERVICE_FOLDER="/etc/systemd/system/"
TARGET_SERVICE_FILE_NAME="yabs"
TARGET_SERVICE_FILE="/etc/systemd/system/$TARGET_SERVICE_FILE_NAME.service"
# Make sure only root can run our script
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

if [ -d "$TARGET_SERVICE_FOLDER" ]; then
	echo "Creating own user $NEWUSER as we don't want to run the application as root..."
	set +e
	useradd -mrU $NEWUSER
	set -e
	echo "DONE."
	echo "Changing ownership of application to $NEWUSER"
	chown -R $NEWUSER $WORKING_DIRECTORY
	chgrp -R $NEWUSER $WORKING_DIRECTORY
	echo "DONE."
	echo "Creating serivce file..."
	touch $TARGET_SERVICE_FILE
#echo "[UNIT]" > $TARGET_SERVICE_FILE
#echo "Requires=network.target" >> $TARGET_SERVICE_FILE
#echo "" >> $TARGET_SERVICE_FILE
	echo "[Service]" > $TARGET_SERVICE_FILE
	echo "Requires=redis.service mongod.service"  >> $TARGET_SERVICE_FILE
	echo "WorkingDirectory=$WORKING_DIRECTORY" >> $TARGET_SERVICE_FILE
	echo "ExecStart=$NODE $EXEC" >> $TARGET_SERVICE_FILE
	echo "Restart=always" >> $TARGET_SERVICE_FILE
	echo "StandardOutput=syslog" >> $TARGET_SERVICE_FILE
	echo "StandardError=syslog" >> $TARGET_SERVICE_FILE
	echo "SyslogIdentifier=$SERVICE_IDENTIFIER" >> $TARGET_SERVICE_FILE
	echo "User=$NEWUSER" >> $TARGET_SERVICE_FILE
	echo "Group=$NEWUSER" >> $TARGET_SERVICE_FILE
	echo "Environment='NODE_ENV=production'" >> $TARGET_SERVICE_FILE
	echo "" >> $TARGET_SERVICE_FILE
	echo "[Install]" >> $TARGET_SERVICE_FILE
	echo "WantedBy=multi-user.target" >> $TARGET_SERVICE_FILE

	echo "DONE."
else 
	echo "Systemd folder not found" 1>&2
fi

echo "DONE generating files."
echo "Registering and starting service"
systemctl enable $TARGET_SERVICE_FILE_NAME
systemctl stop $TARGET_SERVICE_FILE_NAME
systemctl start $TARGET_SERVICE_FILE_NAME
echo "DONE."
echo "Waiting a second..."
sleep 3
echo "Service state is: $(systemctl status $TARGET_SERVICE_FILE_NAME)"

