var axios = require("axios");
var cheerio = require("cheerio");


axios
.get("http://www.espn.com/watch/series/fe048b23-ff41-4b24-9811-36c79cd6d5c0/draft-academy")
.then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    var attribs = $("picture").find("source").attr("srcset")
    if (!attribs) {
        attribs = $("picture").find("img").attr("src")
    }
    console.log(attribs);
});