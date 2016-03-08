[![Code Climate](https://codeclimate.com/repos/553cbb63e30ba00a38006646/badges/e059755cfd07f9faef88/gpa.svg)](https://codeclimate.com/repos/553cbb63e30ba00a38006646/feed)
[![Build Status](https://travis-ci.org/j0h/YABS.svg?branch=master)](https://travis-ci.org/j0h/YABS)

# YABS

YABS is yet another backchannel system. See the doc directory for more information or consult the CONTRIBUTE.md.

## Quick start

install redis-server and mongod. Start them.


Build YABS:

```shell
npm install # this will install all dependencies
sudo npm install -g gulp gulp-cli # make gulp system global
bower install # grep client dependencies
gulp build # build the client
npm start
```

By default YABS is configured to be run behind some proxy like nginx or apache. It is 
important that you have some proxy module for websockets. **If not, YABS won't work.**  

You can still use YABS without a webserver. For this purpose manipulate the base url in the
`client/html/index.html` to `/`.

## Use Cases
YABS was originally developed at RWTH Aachen University. Thus it was introduced to support
large lectures by providing a backchannel system where students may ask questions, answer them
or vote for them if they have the same question or think it is interesting. 
If someone is a lecturer, this person may delete questions and answers or mark a answer as correct.
The learning rooms are configurable. The lecturers may deactivate components or give students the
right to mark answers as correct. The idea is similar to stackoverflow. Lecturers may even
create polls and quizzes for their students. They can look at statistics and how the questions were 
answered. The statistics are only cummulated and this way anonymized. **Students can not be tracked**.
Even the names are generated at first. If they want to change their names afterwards, they 
are free to do so in their personal dashboard.  
Altough YABS was introduced as a backchannel system, it might be used as a conference room ticker or
discussion board. The person giving the talk creates a room and gives the room id to the audience.
Afterwards questions in the board can be discussed by the speaker. People are still able to discuss
the questions beforehand in the background.  

The layer of registration is currently missing but is going to be implemented in the next few weeks.
**A RWTH Aachen TIM ID is required** at the current state of development.

## Contribute
We would be happy to receive contributions. Just drop a pull request and we will discuss 
the code and merge it afterwards.  

In order to make things easier for you there is documentation which you may generate by using
`gulp doc`. If you enabled the dev flag in the `config.js`, then you are able to access the 
html docs directly after starting YABS. Just point your browser to 
```
<base url>/doc/server/index.html
or
<base url>/doc/client/index.html
```

The code is organized in the following way:
```
app 			# contains the server side code
app/Passport*		# code for passport authentication - should be refactored
app/Websocket/		# code for the websocket wrapper - request, response and the server with helper
app/RWTH/		# code for the RWTH API
app/RPC/		# Interfacedefinition with user access level and parameters. 
app/Services/		# Quiz and Poll Services and a Timer Service
app/Startup/		# Code that is called before startup by app.js
app/WebsocketAPI/	# API definition that is called by app/Dispatcher.js.

models/			# all MongoDB database models.

client			# client code
client/html		# html templates and the index html where your js files need to be listed
client/js		# js code. We use angularjs
client/img		# static images
client/css		# the css files
```
To give you a first starting point, we would really appreciate to improve our code climate ranking. 
Grab some file and start refactoring.

## License

```
YABS - Backchannel System
Copyright (C) 2016  Johannes Neuhaus

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
