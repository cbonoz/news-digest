'use strict';
const Alexa = require('alexa-sdk');

// My libraries.
const news = require('./news');

// Enclose your app id value in quotes, like this:  const APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
const APP_ID = "amzn1.ask.skill.5adedf12-0b56-430f-b839-1fecfa9a19c6";
const APP_NAME = "News Digest";

//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = `Say 'next' for the next headline, or 'details' and I can tell you more.`;

//This is the welcome message for when a user starts the skill without a specific intent.
const WELCOME_MESSAGE = `Welcome to ${APP_NAME}! Say headlines to hear the recent news headlines for today.`;

const NEXT_OPTION_MESSAGE = `Say 'detail' for more detail, or 'next' for the next headline.`;

const NO_MORE_HEADLINES_MESSAGE = `That's all the headlines I have for now. Ask me later or again for more headlines!`;

//This is the message a user will hear when they try to cancel or stop the skill, or when they finish a quiz.
const EXIT_SKILL_MESSAGE = `Hope you enjoyed this recent ${APP_NAME}! Goodbye!`;

// These next four values are for the Alexa cards that are created when a user asks about one of the data elements.
// This only happens outside of a challenge.

const UNHANDLED_MESSAGE = "Sorry I didn't get that.";

// If you don't want to use cards in your skill, set the USE_CARDS_FLAG to false.  If you set it to true, you will need an image for each
// fact in your data.
const USE_CARDS_FLAG = true;

let headlineIndex = 0;
let headlines = [];

// Core base app entry handlers.
const handlers = {
    "LaunchRequest": function () {
        this.response.speak(WELCOME_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "NewsIntent": function () {
        const self = this;
        headlineIndex = 0;
        news.getHeadlines((err, {data}) => {
            let message;
            if (err) {
                message = `There was an error getting today's headlines: ${err}`;
                self.response.speak(message);
            } else {
                headlines = data;
                message = `I found ${headlines.length} headlines. Here's the first one: ${headlines[headlineIndex]} ${NEXT_OPTION_MESSAGE}`;
            }
            this.response.speak(message).listen(NEXT_OPTION_MESSAGE);
            self.emit(":responseReady");
        });
    },
    "RepeatIntent": function () {
        if (headlineIndex > 0) {
            headlineIndex -= 1;
        }
        this.emit(':NextIntent');
    },
    "NextIntent": function () {
        headlineIndex += 1;
        let message;
        if (headlineIndex >= headlines.length) {
            message = NO_MORE_HEADLINES_MESSAGE;
        } else {
            message = `Next headline: ${headlines[headlineIndex]['title']} ${NEXT_OPTION_MESSAGE}`
        }
        this.response.speak(message).listen(NEXT_OPTION_MESSAGE);
        this.emit(":responseReady");
    },
    "DetailIntent": function () {
        const message = `${headlines[headlineIndex]['content']} ${NEXT_OPTION_MESSAGE}`;
        this.response.speak(message).listen(NEXT_OPTION_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak(EXIT_SKILL_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent": function () {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled": function () {
        const message = `${UNHANDLED_MESSAGE} ${HELP_MESSAGE}`;
        this.response.speak(message).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // alexa.dynamoDBTableName = 'NewsDigestCache';
    // Set and get items in the dynamo db table via: this.attributes['yourAttribute'] = 'value';
    alexa.registerHandlers(handlers); //, startHandlers, quizHandlers);
    alexa.execute();
};
