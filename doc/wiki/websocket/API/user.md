## user:getAccessLevel

### Request

    {
      uri: 'user:getAccessLevel',
      parameters: {
        roomId : String //the _id of the room, *not* l2pID
      },
      refId: refId
    }
### Response

    {
      accessLevel: Number
    }

**accessLevel definition**:

    {
      "default" : 0,
      "defaultLoggedIn" : 1,
      "defaultMod" : 2,
      "defaultAdmin" : 3,
      "defaultRoot" : 42,
    
      "rwth" : {
          "tutor" : "defaultMod",
          "student" : "defaultLoggedIn",
          "manager" : "defaultAdmin"
      }
    }

## user:ask

### Request

    {
      uri: 'user:ask',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        question: String, //question text
        images: [imageIds] //optional
      },
      refId: refId
    }

### Response

It's a broadcast or an error.

Braodcast part:

    {
      error: null,
      parameters: {
        'roomId': room._id,
        'question': {
           _id : String,
           author: { type: ObjectId, ref: 'User' },
           creationTime: { type: Date, default: Date.now },
           updateTime: { type: Date, default: Date.now },
           content: String,
           visible: { type: Boolean, default: true }
           votes: [{ type : ObjectId, ref: 'User', unique: true }],
           answers: [{ type : ObjectId, ref: 'Answer' }],
           images:[{ type: ObjectId, ref: 'Image' }]
        }
      },
      uri: 'answer:add'
    }

## user:answer

### Request

    {
      uri: 'user:answer',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        questionId: String,
        answer: String, //question text
        images: [imageIds] //optional
      },
      refId: refId
    }

### Response

It's a broadcast or an error.

Braodcast part:

    {
      error: null,
      parameters: {
        'roomId': room._id,
        'questionId': question._id,
        'answer': {
           _id : String,
           author: { type: ObjectId, ref: 'User' },
           creationTime: { type: Date, default: Date.now },
           updateTime: { type: Date, default: Date.now },
           content: String,
           visible: { type: Boolean, default: true },
           images:[{ type: ObjectId, ref: 'Image' }]
        }
      },
      uri: 'anser:add'
    }

## user:fetchRooms
This call fetches new rooms from L2P and sends them to client if new.

### Request

    {
      uri: 'user:fetchRooms,
      parameters: {},
      refId: '' //optional
    }

### Response

if *reqId* is set: standard with data object:

    {
       message: "You got a new room.",
       room: _room
    }

if not:

    {
       uri: 'room:add',
       parameters: {
         room: _room
       }
    }
## user:getRooms

Gets the users roomlist.

### Request

    {
      uri: 'user:getRooms',
      parameters: {},
      refId: refId
    }

### Response

    {
      rooms: rooms
    }

## user:panic

### Request

    {
      uri: 'user:panic',
      parameters: {
        roomId : String //the _id of the room, *not* l2pID
      },
      refId: refId
    }

### Response

    {
      status: true
    }

## user:unpanic

### Request

    {
      uri: 'user:unpanic',
      parameters: {
        roomId : String //the _id of the room, *not* l2pID
      },
      refId: refId
    }

### Response

    {
      status: true
    }
