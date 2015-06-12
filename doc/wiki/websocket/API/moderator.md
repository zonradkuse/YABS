## mod:deleteQuestion
This deletes the question by setting images = [], content = "Der Inhalt wurde gelöscht.", answers = []

### Request
    {
      uri: 'mod:deleteQuestion',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        questionId: String
      },
      refId: refId
    }

### Response
A room broadcast that resets the question.

## mod:deleteAnswer
This deletes the question by setting images = [], content = "Der Inhalt wurde gelöscht."

### Request
    {
      uri: 'mod:deleteAnswer',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        questionId: String,
        answerId: String
      },
      refId: refId
    }

### Response
A room broadcast that resets the answer.

## mod:markAsAnswer

sets the `isAnswer` flag of the answer object to `true`.
### Request

    {
      uri: 'mod:markAsAnswer',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        questionId: String
        answerId: String
      },
      refId: refId
    }

### Response

it's an `answer:add` broadcast.

## mod:unmarkAsAnswer

sets the `isAnswer` flag of the answer object to `false`.
### Request

    {
      uri: 'unmod:markAsAnswer',
      parameters: {
        roomId : String, //the _id of the room, *not* l2pID
        questionId: String
        answerId: String
      },
      refId: refId
    }

### Response

it's an `answer:add` broadcast.

