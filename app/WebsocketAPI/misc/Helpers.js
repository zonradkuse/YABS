/**
 * This module provides some helpers, which might be useful when e.g. sending rooms.
 *
 * @module WSAPI/misc/Helpers
 */

module.exports = {
    prepareRoom : prepareRoom,
    prepareQuestion : prepareQuestion,
    prepareAnswer : prepareAnswer,
    prepareUserTags : prepareUserTags
};

/**
 * This function deletes room.questions.author.{"everything with keys"} and
 * room.questions[i].answers.author.{"every key"}
 *
 * @param {User} user - a user object. needed to determine if a user has already voted.
 * @param {Room} room - a fully populated room
 * @returns {Room} - a for sending prepared Room. A users private data will be removed.
 */
function prepareRoom(user, room) {
    room = JSON.parse(JSON.stringify(room)); // make sure prototype is wayne
    if (room.questions && room.questions.length != 0) {
        for (var i = 0; i < room.questions.length; i++) {
            room.questions[i] = prepareQuestion(user, room.questions[i]);
        }
    }
    return room;
}

/**
 * prepares one question with its answers inside.
 *
 * @param {User} user - optional parameter to check if user voted
 * @param {Question} question
 * @returns {Question}
 */
function prepareQuestion(user, question) {
    if (user && user._id && question.votes && question.votes.length != 0) {
        for (var j = 0; j < question.votes.length; j++) {
            if (user._id == question.votes[j]) {
                question.hasVote = true;
            }
        }
    } else {
        question.hasVote = false;
    }
    question.author = prepareUserTags(question.author);
    question.votes = question.votes.length;
    if (question.answers && question.answers.length != 0) {
        for (var j = 0; j < question.answers.length; j++) {
            question.answers[j] = prepareAnswer(question.answers[j]);
        }
    }
    return question;
}

/**
 * This is different to prepareQuestion() as a answer does not contain any more arrays with user data.
 *
 * @param {Answer} answer
 * @returns {Answer}
 */
function prepareAnswer(answer) {
    answer.author = prepareUserTags(answer.author);
    return answer;
}

/**
 * deletes user specific private fields
 *
 * @param {User} user
 * @returns {User} - user without private fields
 */
function prepareUserTags(user) {
    user.avatar = user.avatar.path;
    delete user.rwth;
    delete user._id;
    delete user.facebook;
    delete user.github;
    delete user.google;
    delete user.access;
    delete user.rights;
    return user;
}
