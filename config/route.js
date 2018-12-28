module.exports = function({ model, app, Op }) {
    app.use('/', require("../routes/index")({ model, Op }));
    app.use('/thoikhoabieu', require("../routes/thoikhoabieu")({ model, Op }))
}
