const router = require("express").Router();
const Chatfuel = require("chatfuel-helper");
module.exports = function({ model, Op }) {
    let User = model.use('user');
    router.post('/', function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id } = req.body;
        let { filterBadword, voiceChat } = req.query;
        User.upsert({
            filterBadword: filterBadword.toUpperCase() == 'Y',
            voiceChat: voiceChat.toUpperCase() == 'Y',
            chatfuel_user_id
        });

        res.send((new Chatfuel()).sendText("Cập nhật cài đặt thành công").render())
    })
    return router;
}
