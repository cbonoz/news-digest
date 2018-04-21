'use strict';
const Alexa = require('alexa-sdk');

// My libraries.
const news = require('./news');

// Enclose your app id value in quotes, like this:  const APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
const APP_ID = "amzn1.ask.skill.5adedf12-0b56-430f-b839-1fecfa9a19c6";
const APP_NAME = "News Digest";

const NEXT_OPTION_MESSAGE = `Say 'detail', 'repeat', or 'next' for the next headline.`;
//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = `${NEXT_OPTION_MESSAGE} And I can tell you more.`;

//This is the welcome message for when a user starts the skill without a specific intent.
const WELCOME_MESSAGE = `Welcome to ${APP_NAME}! Say headlines to hear the recent news headlines for today.`;

const NO_MORE_HEADLINES_MESSAGE = `That's the ${APP_NAME} I have for now. Open me again later and I'll check for new headlines`;

//This is the message a user will hear when they try to cancel or stop the skill, or when they finish a quiz.
const EXIT_SKILL_MESSAGE = `Hope you enjoyed this recent pull of ${APP_NAME}! Goodbye!`;

// These next four values are for the Alexa cards that are created when a user asks about one of the data elements.
// This only happens outside of a challenge.

const UNHANDLED_MESSAGE = "Sorry I didn't get that.";

const ERROR_MESSAGE = `Sorry, there was an error getting today's headlines`;

// If you don't want to use cards in your skill, set the USE_CARDS_FLAG to false.  If you set it to true, you will need an image for each
// fact in your data.
const USE_CARDS_FLAG = true;

const states = {
    NEWSMODE: '_NEWSMODE' // Prompt the user to start or restart the game.
};

// Core base app entry handlers.
const handlers = {
    "LaunchRequest": function () {
        this.emit(":NewsIntent");
    },
    "NewsIntent": function () {
        const self = this;
        self.attributes['headlineIndex'] = 0;
        news.getHeadlines((err, {data}) => {
            console.log('data', data);
            let message;
            if (err) {
                message = `${ERROR_MESSAGE}: ${err}`;
                self.response.speak(message);
            } else {
                const headlines = data.articles;
                self.attributes['headlines'] = headlines;
                message = `I found ${headlines.length} recent headlines. The top headline is: ${headlines[0].title} ${NEXT_OPTION_MESSAGE}`;
                self.handler.state = states.NEWSMODE;
            }
            self.response.speak(message).listen(NEXT_OPTION_MESSAGE);
            self.emit(":responseReady");
        });
    },
    "Unhandled": function () {
        const message = `${UNHANDLED_MESSAGE} ${HELP_MESSAGE}`;
        this.response.speak(message).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    }
};

const newsModeHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    "RepeatIntent": function () {
        this.emit(':NextIntent', 0);
    },
    "NextIntent": function (offset) {
        const self = this;
        const headlines = self.attributes['headlines'];
        if (!offset) {
            offset = 1;
        }
        const headlineIndex = self.attributes['headlineIndex'] + offset;
        self.attributes['headlineIndex'] = headlineIndex;
        let message;
        if (headlineIndex >= headlines.length) {
            message = NO_MORE_HEADLINES_MESSAGE + " " + EXIT_SKILL_MESSAGE;
            this.response.speak(message);
            this.handler.state = '';
        } else {
            const currentHeadline = headlines[headlineIndex];
            message = `${headlineIndex + 1}${news.getNumberSuffix(headlineIndex + 1)} headline: ${currentHeadline.title} ${NEXT_OPTION_MESSAGE}`;
            this.response.speak(message).listen(WELCOME_MESSAGE);
        }

        this.emit(":responseReady");
    },
    "DetailIntent": function () {
        const self = this;
        const headlines = self.attributes['headlines'];
        const headlineIndex = self.attributes['headlineIndex'];
        const currentHeadline = headlines[headlineIndex];
        if (currentHeadline) {
            const title = currentHeadline.title;
            const content = currentHeadline.content;
            const message = `${content} ${NEXT_OPTION_MESSAGE}`;

            self.response.cardRenderer(title, content, '')
                .speak(message)
                .listen(NEXT_OPTION_MESSAGE);
        } else {
            self.response.speak(ERROR_MESSAGE);
        }

        self.emit(":responseReady");
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
});

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.dynamoDBTableName = 'NewsDigestCache';
    alexa.registerHandlers(handlers, newsModeHandlers);
    alexa.execute();
};
