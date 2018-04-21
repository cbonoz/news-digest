const library = (function () {

    const scrapeIt = require("scrape-it");

    const NEWS_BASE_URL = `https://www.reuters.com`;
    const WORLD_NEWS_URL = `${NEWS_BASE_URL}/news/archive/worldNews`;

    const getRandom = (facts) => {
        return facts[Math.floor(Math.random() * facts.length)];
    };

    const formatDateTimeMs = (timeMs) => {
        const date = new Date(timeMs);
        return `${date.toDateString()} ${date.toLocaleTimeString()}`;
    };

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function toTitleCase(str) {
        if (str) {
            return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        }
        return str
    }

    const TIMEZONE_MAP = {
        EST: 'Eastern',
        EDT: 'Eastern',
        CST: 'Central',
        CDT: 'Central',
        MST: 'Mountain',
        MDT: 'Mountain',
        PST: 'Pacific',
        PDT: 'Pacific',
    };

    const timeZoneRegex = new RegExp(Object.keys(TIMEZONE_MAP).join("|"),"gi");

    function replaceTimeZoneAbbr(str) {
        str = str.replace(timeZoneRegex, function(matched){
            return TIMEZONE_MAP[matched];
        });
        return str;
    }

    function formatContent(x) {
        x = x.replace(/\s+/g, ' ').trim();
        const sentences = x.split('.');

        // last sentence is the reported time.
        const lastSentence = replaceTimeZoneAbbr(sentences[sentences.length - 1]);
        sentences[sentences.length - 1] = ` Reported at:${lastSentence} today.`;
        return sentences.join('.')
    }

    function getNumberSuffix() {
        if (i < 2) {
            return 'st';
        } else if (i < 3) {
            return 'nd';
        } else if (i < 4) {
            return 'rd';
        } else {
            return 'th';
        }
    }

    /*
     * callback cb: (err, data) => { ... }
     */
    function getHeadlines(cb) {
        // Extract the headlines from the Reuters website.

        // Callback interface
        scrapeIt(WORLD_NEWS_URL, {
            // Fetch the articles
            articles: {
                listItem: ".story"
                , data: {
                    title: '.story-title',
                    content: {
                        selector: '.story-content',
                        convert: x => formatContent(x)
                    },
                    timestamp: {
                        selector: '.timestamp',
                    }, url: {
                        selector: ".story-content > a",
                        attr: "href"
                    }
                }
            }
        }, cb);
    }

    return {
        capitalize: capitalize,
        getHeadlines: getHeadlines,
        getNumberSuffix: getNumberSuffix,
        getRandom: getRandom,
        replaceTimeZoneAbbr: replaceTimeZoneAbbr,
        toTitleCase: toTitleCase,
        formatDateTimeMs: formatDateTimeMs,
        WORLD_NEWS_URL: WORLD_NEWS_URL
    }

})();
module.exports = library;

