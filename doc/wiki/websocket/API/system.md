#General
system-prefixed calls are for basic tests und login-specific. Every Response ist build like

    {
        "error": (err ? err.message : null)
        "data": data,
        "refId": refId
    }

The following calls only describe the `data` part of the response.
#Calls
## system:logout
This deletes your current session.
### Request

    {
      uri: "system:logout"
      parameters: {},
      refId: String
    }

### Response

    data: {
      status: Boolean // true if success, false if not logged in
    }

## system:enterRoom
Enter a room to get the broadcast messages. if you are not in a room you will get an error saying, that you are not in a room.

### Request

    {
       uri: "system:enterRoom",
       parameters: {
         roomId: String
       },
       refId: String
    {

### Response

    data: {
      status: Boolean, // true if success, false if not logged in
      hasRoomPanicRegistered: Boolean, // true if room has panic enabled
      hasUserPanic: Boolean // true if user has panic
    }
## system:ping
Simple response test. 

### Request
    data: {
        "uri": "system:ping",
        "parameters": {},
        "refId" : refId
    }

### Return

    {
      message: "pong"
    }

## system:whoami
### Request
    {
        "uri": "system:whoami",
        "parameters": {},
        "refId" : refId
    }
### Return

If not logged in:

    data : {
      status : false,
      message: "You are currently not logged in."
    }

If logged in:

    data : {
      status: true,
      message: user._id 
    }

## system:login
This invokes a authentication request at Campus OAuth. If successful, the server requests ever user room. This results in a push to the user.

###Request

    {
        "uri": "system:login",
        "parameters": {},
        "refId": refId
    }

###Response
On Success:

    data : { 
      status : true
    }

On Error:

The error object spoken of in the general section will be set.