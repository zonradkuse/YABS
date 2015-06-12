## room:userCount
Gets the current Number of Users. Minimum AccessLevel is Moderator. Current UserCount will be in panics too. (Jens, go!)

### Request
    {
      uri: 'room:userCount',
      parameters: {
        roomId: roomId
      },
      refId: refId
    }

### Response

    {
      count: Number
    }

##room:getQuestions
###Request
    {
      uri: 'room:getQuestions',
      parameters: {
        roomId: roomId
      },
      refId: refId
    }

###Response
    {
      questions: [
        {
          _id : String,
          author: { type: ObjectId, ref: 'User' },
          creationTime: { type: Date, default: Date.now },
          updateTime: { type: Date, default: Date.now },
          content: String,
          votes: [{ type : ObjectId, ref: 'User', unique: true }],
          answers: [{ type : ObjectId, ref: 'Answer' }],
          visible: { type: Boolean, default: true }
        }, 
        ... 
      ]
    }

##room:getAnswers
###Request
    {
      uri: 'room:getAnswers',
      parameters: {
        roomId: roomId, 
        questionId: questionId
      },
      refId: refId
    }

###Response
    {
      answers: [
        {
          _id : String,
          author: { type: ObjectId, ref: 'User' },
          creationTime: { type: Date, default: Date.now },
          updateTime: { type: Date, default: Date.now },
          content: String,
          visible: { type: Boolean, default: true }
        }, 
        ... 
      ]
    }

##room:enablePanicEvents
Register the room to receive the live panic events and create the graph.
The interval object is used to define the time interval, in which the live events should be send to the client and to have the resolution of the graph. Intervals are in seconds.
###Request
    {
      uri: 'room:enablePanicEvents',
      parameters: {
        roomId: String, 
        intervals: {
          live: Number, //optional, default: 30s
          graph: Number //optional, default: 60s
        }
      },
      refId: refId
    }

###Response
After registration of room a broadcast to all active room members is send with uri "room:panicStatus".
The same response is sent to a single user if his panic has expired.

    {
      isEnabled: Boolean,
      hasUserPanic: Boolean
    }

Send a Broadcast each x second with the live events to all moderators with uri "room:livePanic"
    
    {
      panics: Number,
      activeUsers: Number,
      importantQuestions: Number
    }

##room:disablePanicEvents
Unregister room and stop the live broadcast service
###Request
    {
      uri: 'room:disablePanicEvents',
      parameters: {
        roomId: String
      },
      refId: refId
    }

###Response
Broadcast which is send to all active room members with uri "room:panicStatus"

    {
      isEnabled: Boolean,
      hasUserPanic: Boolean
    }

##room:getPanicGraph
###Request
    {
      uri: 'room:getPanicGraph',
      parameters: {
        roomId: String
      },
      refId: refId
    }

###Response
    {
      graph: [ {time: Date, panics: Number}, ... ]
    }