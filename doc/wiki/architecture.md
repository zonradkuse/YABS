# Abstract

Implementing features is not trivial. YABS implements different ways to react to events. First of all, most implemented features use WebSockets. YABS wraps the Websocktlogic to intercept the session information and do some checks on a interface file. **You should never touch this**, despite you need to add your interface definition to the Interface.json File. The websocket framework inherits from node EventEmitter, which allows you to implement pretty efficient logic. We will give a short example and the parameter definition, you can work with.

The second way to implement a feature is using express.js. This should only be done for really large data sets. Currently it is only used for image uploading, manual administration activation (because we needed a fast workaround) and third-party oauth as the standard defines a http request. To give a example: If many users will need a big amount of data (lets say around 100kb of data), websockets will need a huge amount of resources. [Read this](https://medium.com/@denizozger/finding-the-right-node-js-websocket-implementation-b63bfca0539). This explains pretty well the problem with websockets and often issued large data, although this is pretty outdated. If this is your usecase, you should consider using express.js as your API Endpoint implementation, not websockets.

# Basics

## Architecture

This is not a complete view. We just hope, you get an idea of how everything is working. This is vital in order to implement a new feature properly.

![](wikistatic/YABS%20Architektur.png)
## DataStores

### Redis

### MongoDB

# Server Side Implementation Details

# Client Side Implementation Details
