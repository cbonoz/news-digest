'use strict';

const Alexa = require('ask-sdk-core');

// My libraries.
const news = require('./news');

// Enclose your app id value in quotes, like this:  const APP_ID = "amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1";
// const APP_ID = "amzn1.ask.skill.5adedf12-0b56-430f-b839-1fecfa9a19c6";
const APP_NAME = "News Digest";

const NEXT_OPTION_MESSAGE = `Say 'detail', 'repeat', or 'next headline' for the next headline.`;
//This is the message a user will hear when they ask Alexa for help in your skill.
const HELP_MESSAGE = `${NEXT_OPTION_MESSAGE} And I can tell you more.`;

//This is the welcome message for when a user starts the skill without a specific intent.
const WELCOME_MESSAGE = `Welcome to ${APP_NAME}!`;

const NO_MORE_HEADLINES_MESSAGE = `That's the ${APP_NAME} I have for now. Open me again later and I'll check for new headlines`;

//This is the message a user will hear when they try to cancel or stop the skill, or when they finish a quiz.
const EXIT_SKILL_MESSAGE = `Hope you enjoyed this recent pull of ${APP_NAME}! Goodbye!`;

// These next four values are for the Alexa cards that are created when a user asks about one of the data elements.
// This only happens outside of a challenge.

const UNHANDLED_MESSAGE = "Sorry I didn't get that.";

const ERROR_MESSAGE = `Sorry, there was an error getting today's headlines`;

function safeLog(d, k) {
    if (d.hasOwnProperty(k)) {
        console.log(k, d[k]);
    } else {
        console.log(k, 'undefined');
    }
}

const states = {
    START: `_START`,
    NEWS: `_NEWS`,
};

// **************************** //
// Core base app entry handlers //
// **************************** //

const LaunchAndNewsRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' || request.intent.name === 'NewsIntent';
    },
    handle(handlerInput) {
        console.log('LaunchAndNewsHandler');
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['headlineIndex'] = 0;
        return new Promise((resolve) => {
            news.getHeadlines((err, {data}) => {
                let message;
                let reprompt;
                if (err) {
                    console.error('getHeadlines error', JSON.stringify(err));
                    message = `${ERROR_MESSAGE}: ${err}`;
                    reprompt = WELCOME_MESSAGE;
                    sessionAttributes['state'] = states.START;
                } else {
                    const headlines = data.articles;
                    sessionAttributes['headlines'] = headlines;
                    message = `${WELCOME_MESSAGE} I found ${headlines.length} recent headlines. ` +
                        `The top headline is: ${headlines[0].title}. ${NEXT_OPTION_MESSAGE}`;
                    reprompt = NEXT_OPTION_MESSAGE;
                    sessionAttributes['state'] = states.NEWS;
                }

                resolve(handlerInput.responseBuilder
                    .speak(message)
                    .reprompt(reprompt)
                    .withSimpleCard(APP_NAME, message)
                    .getResponse());
            });
        });
    }
};

const NextOrRepeatHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;
        console.log('NextOrRepeatHandler state', sessionAttributes['state'], safeLog(sessionAttributes, 'headlines'));
        return sessionAttributes['state'] === states.NEWS && (request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.RepeatIntent' || request.intent.name === 'NextIntent'));
    },
    handle(handlerInput) {
        console.log('NextOrRepeatHandler');
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;
        const headlines = sessionAttributes['headlines'];
        let headlineIndex = sessionAttributes['headlineIndex'];
        if (request.intent.name === 'NextIntent') {
            // If next intent, increment the headline index.
            headlineIndex += 1;
            sessionAttributes['headlineIndex'] = headlineIndex;
        }

        if (headlines === undefined) {
            return LaunchAndNewsRequestHandler.handle(handlerInput);
        }
        console.log('headlines: ' + headlines.length + ", headlineIndex: " + headlineIndex);

        let message;
        if (headlineIndex >= headlines.length) {
            message = NO_MORE_HEADLINES_MESSAGE + " " + EXIT_SKILL_MESSAGE;
            sessionAttributes['state'] = states.START;
            return handlerInput.responseBuilder
                .speak(message)
                .getResponse();
        } else {
            const currentHeadline = headlines[headlineIndex];
            message = `${headlineIndex + 1}${news.getNumberSuffix(headlineIndex + 1)} headline: ${currentHeadline.title} ${NEXT_OPTION_MESSAGE}`;
            sessionAttributes['state'] = states.NEWS;
            return handlerInput.responseBuilder
                .speak(message)
                .reprompt(WELCOME_MESSAGE)
                .getResponse();
        }
    },
};

const DetailHandler = {
    canHandle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const request = handlerInput.requestEnvelope.request;
        console.log('DetailHandler state', sessionAttributes['state'], safeLog(sessionAttributes, 'headlines'));
        return sessionAttributes['state'] === states.NEWS &&
            (request.type === 'IntentRequest' && request.intent.name === 'DetailIntent');
    },
    handle(handlerInput) {
        console.log('DetailHandler');
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const headlines = sessionAttributes['headlines'];
        const headlineIndex = sessionAttributes['headlineIndex'];

        if (headlines === undefined) {
            return LaunchAndNewsRequestHandler.handle(handlerInput);
        }
        console.log('headlines: ' + headlines.length + ', headlineIndex: ' + headlineIndex);

        const currentHeadline = headlines[headlineIndex];
        if (currentHeadline) {
            // const title = currentHeadline.title;
            const content = currentHeadline.content;
            const message = `${content} ${NEXT_OPTION_MESSAGE}`;
            sessionAttributes['state'] = states.NEWS;
            return handlerInput.responseBuilder
                .speak(message)
                .withSimpleCard(APP_NAME, content)
                .reprompt(NEXT_OPTION_MESSAGE)
                .getResponse();
        } else {
            sessionAttributes['state'] = states.START;
            return handlerInput.responseBuilder
                .speak(ERROR_MESSAGE)
                .getResponse();
        }
    }
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(EXIT_SKILL_MESSAGE)
            .getResponse();
    },
};

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(HELP_MESSAGE)
            .reprompt(HELP_MESSAGE)
            .getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        console.log("Inside ErrorHandler");
        return true;
    },
    handle(handlerInput, error) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log(`Error handled: ${error.message}`);
        let message = '';
        if (sessionAttributes['state'] === states.NEWS) {
            message = HELP_MESSAGE;
        } else {
            message = WELCOME_MESSAGE;
        }

        return handlerInput.responseBuilder
            .speak(`${UNHANDLED_MESSAGE} ${message}`)
            .reprompt(message)
            .getResponse();
    },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder.addRequestHandlers(
    LaunchAndNewsRequestHandler,
    DetailHandler,
    NextOrRepeatHandler,
    HelpHandler,
    ExitHandler,
)
    .addErrorHandlers(ErrorHandler)
    .lambda();
