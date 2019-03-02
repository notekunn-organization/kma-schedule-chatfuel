// const router = require("express").Router()
// module.exports = function({model, Op}){

// }
const URL = require("url");
const router = require("express").Router();
const Chatfuel = require("chatfuel-helper");
const request = require("request-promise");
const { boiThay, boiBai } = require("../controller/thayboi");
const regexUrl = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
module.exports = function({ model, Op }) {
    const User = model.use('user');
    const Describe = model.use('describe');
    router.post('/', async function(req, res, next) {
        let chatfuel = new Chatfuel();
        /*======== Lưu thông tin user ====*/
        // let ip = req.headers['x-forwarded-for'];
        // if(ip.indexOf('137.116') != 0 && ip.indexOf('104.209') != 0) return res.status(304).send('Không có quyền truy cập');
        let { gender, 'last name': last_name = '', 'first name': first_name = '', 'profile pic url': profile_pic_url = '', 'chatfuel user id': chatfuel_user_id = 1000 } = req.body;

        let [user, created] = await User.findOrCreate({
            where: {
                chatfuel_user_id
            },
            defaults: {
                last_name,
                first_name,
                gender,
                profile_pic_url
            }
        })
        // .spread(function(user, created) {
        //     if (!created) user.update({
        //         last_name,
        //         first_name,
        //         gender,
        //         profile_pic_url
        //     }, { where: {} })
        // })
        let { filterBadword, voiceChat } = user.get({ plain: true });
        // console.log(user.get({ plain: true }))
        /*======== Lưu xong ===========*/
        //Set JSON HEADER

        res.set({ 'Content-Type': 'application/json' });
        let userMessage = req.query.message;
        (async function xuly() {

            //Kiểm tra attachment và url
            if (regexUrl.test(userMessage)) {
                let url = URL.parse(userMessage);
                switch (url.hostname) {
                    case 'video.xx.fbcdn.net':

                        break;
                    case 'scontent.xx.fbcdn.net':

                        break;

                    default:
                        break;

                }
            }

            if (userMessage == "test") {
                console.log("testing");
                return res.json({
                    "messages": [{
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "list",
                                "top_element_style": "compact",
                                "elements": [{
                                        "title": "Chatfuel Rockets Jersey",
                                        "default_action": {
                                            "messenger_extensions": false
                                        },
                                        "buttons": [{
                                            "type": "web_url",
                                            "url": "https://rockets.chatfuel.com/store",
                                            "title": "View Item"
                                        }]
                                    },
                                    {
                                        "title": "Chatfuel Rockets Jersey",
                                        "default_action": {
                                            "messenger_extensions": false
                                        },
                                        "buttons": [{
                                            "type": "web_url",
                                            "url": "https://rockets.chatfuel.com/store",
                                            "title": "View Item"
                                        }]
                                    }
                                ]
                            }
                        }
                    }]
                })
            }
            //Nếu thực hiện tra cứu thời khóa biểu bằng lệnh            


            if (/^tkb/.test(userMessage)) {

                return res.send((new Chatfuel()).redirectToBlock(['thoi_khoa_bieu']));
            }


            if (/^tinchi/.test(userMessage)) {


                let userDescribe = await Describe.findOne({ where: { chatfuel_user_id } });
                if (!userDescribe) return res.end();
                return res.send((new Chatfuel()).redirectToBlock(['tin_chi']));
            }

            if (userMessage.includes("thầy")) {
                return res.send((new Chatfuel()).sendText(boiThay()).render());
            }

            if (userMessage.includes("bói bài")) {
                return res.send((new Chatfuel()).sendText(boiBai()).render());
            }
            //Mặc định trả về tin nhắn cũ
            if (!process.env.SIMSIMI_KEY) return res.send((new Chatfuel()).sendText(userMessage).render());
            //
            request({
                    url: 'http://api.simsimi.com/request.p',
                    qs: {
                        key: process.env.SIMSIMI_KEY,
                        text: userMessage,
                        lc: 'vn',
                        ft: filterBadword ? '1.0' : '0.0'
                    },
                    json: true
                })
                .then(({ response = userMessage }) => {
                    if (voiceChat) return res.send((new Chatfuel()).sendAudio(`http://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURI(response)}`).render());
                    return res.send((new Chatfuel()).sendText(response).render())
                })
                .catch(() => res.send((new Chatfuel()).sendText(userMessage).render()))
        })()

    });

    router.get('/', function(req, res) {

        res.set({ 'Content-Type': 'application/json' });
        res.send((new Chatfuel()).sendText("Demo webhook!\nHỗ trợ Tiếng Việt!").render())
    })

    return router;
}
