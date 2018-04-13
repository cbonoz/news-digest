const assert = require("assert"); // node.js core module
const news = require('./news');

describe('news digest', function () {

    it('is ok', function () {
        assert.ok(true);
    });

    it('getHeadlines', function () {

        news.getHeadlines((err, {data}) => {
            console.log(err || data);
            assert.ok(data.length > 0);

            // Check one entry:
            const firstHeadline = data[0];
            assert.ok(firstHeadline.hasOwnProperty('url'));
            assert.ok(firstHeadline.hasOwnProperty('title'));
            assert.ok(firstHeadline.hasOwnProperty('content'));
            assert.ok(firstHeadline.hasOwnProperty('timestamp'));
        });
        assert.ok(true);
    });

});

