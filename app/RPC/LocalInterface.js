var userRoles = require('./../../config/UserRoles.json');

module.exports = {
  "data": [
    {
      "uri": "system:ping",
      "parameters": {},
      "accessLevel": userRoles.default
    },
    {
      "uri": "system:benchmark",
      "parameters": {},
      "accessLevel": userRoles.defaultRoot
    },
    {
      "uri": "system:login",
      "parameters": {},
      "accessLevel": userRoles.default
    },
    {
      "uri": "system:time",
      "parameters": {},
      "accessLevel": userRoles.default
    },
    {
      "uri": "system:logout",
      "parameters": {},
      "accessLevel": userRoles.default
    },
    {
      "uri": "system:enterRoom",
      "parameters": {
        "roomId": String
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "system:whoami",
      "parameters": {},
      "accessLevel": userRoles.default
    },
    {
      "uri": "user:fetchRooms",
      "parameters": {},
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:getRooms",
      "parameters": {},
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:ask",
      "parameters": {
        "roomId": String,
        "question": String
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:answer",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "answer": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:vote",
      "parameters": {
        "roomId": "",
        "questionId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:changeName",
      "parameters": {
        "username": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "room:getQuestions",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "room:getAnswers",
      "parameters": {
        "roomId": "",
        "questionId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "room:exists",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "room:enablePanicEvents",
      "parameters": {
        "roomId": "",
        "intervals": {}
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "room:disablePanicEvents",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "room:getPanicGraph",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "question:getVotes",
      "parameters": {
        "questionId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "question:setContent",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "content": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "question:setVisibility",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "isVisible": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:markAsAnswer",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "answerId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "mod:unmarkAsAnswer",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "answerId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "mod:question:markAsGood",
      "parameters": {
        "roomId": "",
        "questionId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:question:unmarkAsGood",
      "parameters": {
        "roomId": "",
        "questionId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:deleteQuestion",
      "parameters": {
        "roomId": "",
        "questionId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:deleteAnswer",
      "parameters": {
        "roomId": "",
        "questionId": "",
        "answerId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "room:userCount",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "user:panic",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:unpanic",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:getAccessLevel",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "quiz:create",
      "parameters": {
        "roomId": "",
        "questions": "",
        "dueDate": "",
        "description": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "poll:create",
      "parameters": {
        "roomId": "",
        "answers": "",
        "dueDate": "",
        "description": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "poll:answer",
      "parameters": {
        "roomId": "",
        "arsId": "",
        "answerId": []
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "poll:getAll",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "poll:get",
      "parameters": {
        "roomId": "",
        "arsId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "poll:getNext",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "poll:delete",
      "parameters": {
        "roomId": "",
        "pollId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "poll:getStatistics",
      "parameters": {
        "pollId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "quiz:answer",
      "parameters": {
        "roomId": "",
        "quizId": "",
        "answerIds": []
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "quiz:getAll",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "quiz:get",
      "parameters": {
        "arsId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "quiz:delete",
      "parameters": {
        "roomId": "",
        "quizId": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "quiz:toggleActivation",
      "parameters": {
        "roomId": "",
        "quizId": "",
        "active": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "poll:toggleActivation",
      "parameters": {
        "roomId": "",
        "pollId": "",
        "active": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "quiz:getStatistics",
      "parameters": {
        "quizId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "mod:setRoomConfigDiscussion",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:setRoomConfigPanicbutton",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:setRoomConfigQuiz",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:mulitOptionPanicButton",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:questionerMayMarkAnswer",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:userMayAnswerToQuestion",
      "parameters": {
        "roomId": "",
        "status": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "mod:thresholdForImportantQuestion",
      "parameters": {
        "roomId": "",
        "val": ""
      },
      "accessLevel": userRoles.defaultMod
    },
    {
      "uri": "user:joinRoom",
      "parameters": {
        "roomId": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri": "user:createRoom",
      "parameters": {
        "roomName": ""
      },
      "accessLevel": userRoles.defaultLoggedIn
    },
    {
      "uri" : "mod:externalStudentsMayEnterRoom",
      "parameters" : {
        "status" : "",
        "roomId" : ""
      },
      "accessLevel" : userRoles.defaultMod
    },
    {
      "uri" : "system:open",
      "parameters" : {},
      "accessLevel" : userRoles.default
    },
    {
      "uri" : "system:close",
      "parameters" : {},
      "accessLevel" : userRoles.default
    }

  ]
};