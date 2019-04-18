const db = require("../models");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

module.exports = app => {
    app.get("/", (req, res) => {
        db.Article.find({})
            .populate("note")
            .then(function (data) {


                data = data.map((element) => {

                    var noNote = true;
                    var note = "";
                    var noteId = "";
                    try {
                        if (element.note.body !== "") {
                            noNote = false;
                            note = element.note.body;
                            noteId = element.note._id;
                        }
                    } catch (err) {

                    }

                    var returnObject = {
                        _id: element._id,
                        title: element.title,
                        link: element.link,
                        image: element.image,
                        noNote: noNote,
                        note: note,
                        noteId: noteId
                    }

                    return returnObject
                })


                const hbsObject = {
                    articles: data
                };

                // console.log(data);
                res.render("index", hbsObject);
            })
            .catch(function (err) {
                console.log(err);
                res.json(err);
            });
    });


    // A GET route for scraping the echoJS website
    app.get("/scrape", function (req, res) {
        //get rid of old articles that do not have notes.  Anything older than 1 day:
        db.Article.find({})
            .populate("note")
            .then(async function (dbArticle) {

                if (dbArticle) {
                    await removeOldArticles(dbArticle, 0);
                }

                axios
                    .get("https://espn.go.com")
                    .then(async function (response) {
                        // Then, we load that into cheerio and save it to $ for a shorthand selector
                        var $ = cheerio.load(response.data);

                        var lis = $(".headlineStack__list").children()

                        var lis = lis.map((i, element) => {

                            //We don't want ESPN Plus links because they are pay only
                            var aClass = $(element).find('a').attr("class")
                            var isEspnPlus = false
                            if (aClass) {
                                isEspnPlus = aClass.includes("icon-espnplus-before")
                            }

                            var title = $(element).find('a').text();
                            var link = $(element).find('a').attr("href");
                            if (link.substring(0, 4) != "http") {
                                var link = "https://espn.go.com" + link
                            }
                            var articleId = $(element).data("story-id");
                            var returnObject = {
                                title: title,
                                link: link,
                                articleId: articleId,
                                isEspnPlus: isEspnPlus
                            }
                            return returnObject
                        })

                        await addToList(lis, 0);
                        res.send("Scrape Complete")

                    })
            })


    });

    // Route for saving/updating an Article's associated Note
    app.post("/articles/:id", function (req, res) {
        //delete old note
        console.log(req.body);
        var oldNoteId = req.body.oldNoteId

      
        db.Note.findOneAndRemove({ _id: oldNoteId })
            .then(function (dbNote) {
                db.Note.create({
                    body: req.body.body
                })
                    .then(function (dbNote) {
                        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
                    })
                    .then(function (dbArticle) {
                        // If we were able to successfully update an Article, send it back to the client
                        res.json(dbArticle);
                    })
                    .catch(function (err) {
                        // If an error occurred, send it to the client
                        res.json(err);
                    });
            })
            .catch(function(err) {
                db.Note.create({
                    body: req.body.body
                })
                    .then(function (dbNote) {
                        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
                    })
                    .then(function (dbArticle) {
                        // If we were able to successfully update an Article, send it back to the client
                        res.json(dbArticle);
                    })
                    .catch(function (err) {
                        // If an error occurred, send it to the client
                        res.json(err);
                    });
            })
    });


    // Route for saving/updating an Article's associated Note
    app.delete("/noteDelete/", function (req, res) {
        //delete old note
        // console.log(req.body);
        var oldNoteId = req.body.oldNoteId

        db.Note.findOneAndRemove({ _id: req.body.noteId })
            .then(function (dbNote) {
                db.Article.findOneAndUpdate({ _id: req.body.ArticleId }, { note: "" }, { new: true })
                    .then(function (dbArticle) {
                        res.json(dbArticle);
                    })
            })
    });

    function addToList(articles, articleKey) {
        return new Promise(async function (resolve, reject) {

            if (articleKey < articles.length) {

                if ((articles[articleKey].articleId) && (!articles[articleKey].isEspnPlus)) {
                    var exists = await doesArticleExist(articles[articleKey].articleId);

                    if (!exists) {
                        //if adding article, add picture
                        var image = await getPicture(articles[articleKey].link)

                        await createArticle(articles[articleKey].title, articles[articleKey].link, image, articles[articleKey].articleId)
                    }
                }

                articleKey++
                await addToList(articles, articleKey);
                resolve(true);

            }
            else {
                resolve(true);
            }
        })
    }

    function createArticle(title, link, image, articleId) {
        return new Promise(async function (resolve, reject) {
            db.Article
                .create({
                    title: title,
                    link: link,
                    image: image,
                    articleId: articleId
                })
                .then(result => {
                    resolve(true)
                })
                .catch(err => {
                    resolve(true)
                })
        })
    }


    function doesArticleExist(articleId) {
        return new Promise(async function (resolve, reject) {
            db.Article
                .findOne({ articleId: articleId })
                .then(function (dbArticle) {
                    if (dbArticle) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
        })
    }


    async function removeOldArticles(articles, articleKey) {
        return new Promise(async function (resolve, reject) {


            if (articleKey < articles.length) {

                if ((!articles[articleKey].note) || (articles[articleKey].note === "") || (!articles[articleKey].dateCreated) || (moment(articles[articleKey].dateCreated).diff('days', moment()) > 0)) {

                    db.Article.remove({ articleId: articles[articleKey].articleId })
                }

                articleKey++
                await removeOldArticles(articles, articleKey);
                resolve(true);
            }
            else {
                resolve(true);
            }

        })
    }


    function getPicture(link) {
        return new Promise(async function (resolve, reject) {
            axios
                .get(link)
                .then(function (response) {
                    // Then, we load that into cheerio and save it to $ for a shorthand selector
                    var $ = cheerio.load(response.data);
                    var image = $("picture").find("source").attr("srcset")
                    if (!image) {
                        image = $("picture").find("img").attr("src")
                    }
                    if (!image) {
                        image = ""
                    }
                    resolve(image)
                })
                .catch(err => {
                    resolve("")
                })
        })
    }


}