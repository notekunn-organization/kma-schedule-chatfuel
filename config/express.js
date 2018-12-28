const bodyParser = require("body-parser");
module.exports = function({ app, express, model }) {
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());

    // app.use(function(req, res, next) {
    //     next();
    // })
}
