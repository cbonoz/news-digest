const assert = require("assert"); // node.js core module
const news = require('./news');

describe('news digest', function () {

    it('is ok', function () {
        assert.ok(true);
    });

    it('getHeadlines', function () {
        news.getHeadlines((err, {data}) => {
            const headlines = data;

            console.log(err || headlines);
            assert.ok(headlines.length > 0);

            // Check one entry:
            const firstHeadline = headlines[0];
            assert.ok(firstHeadline.hasOwnProperty('url'));
            assert.ok(firstHeadline.hasOwnProperty('title'));
            assert.ok(firstHeadline.hasOwnProperty('content'));
            assert.ok(firstHeadline.hasOwnProperty('timestamp'));
        });
        assert.ok(true);
    });

    it('testAbbrEDT', function () {
        const s = "Reported at: 4:14pm EDT today.";
        const expected = "Reported at: 4:14pm Eastern today.";
        assert.equal(news.replaceTimeZoneAbbr(s), expected);
    });

    it('testAbbrPST', function () {
        const s = "Reported at: 4:14pm PST today.";
        const expected = "Reported at: 4:14pm Pacific today.";
        assert.equal(news.replaceTimeZoneAbbr(s), expected);
    });
});

