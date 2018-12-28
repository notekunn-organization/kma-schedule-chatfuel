// const router = require("express").Router()
// module.exports = function({model, Op}){

// }

const router = require("express").Router();
const Chatfuel = require("chatfuel-helper");
module.exports = function({ model, Op }) {
    const User = model.use('user');
    const Describe = model.use('describe');
    router.post('/', function(req, res, next) {
        let chatfuel = new Chatfuel();
        /*======== Lưu thông tin user ====*/
        // let ip = req.headers['x-forwarded-for'];
        // if(ip.indexOf('137.116') != 0 && ip.indexOf('104.209') != 0) return res.status(304).send('Không có quyền truy cập');
        let { gender, 'last name': last_name = '', 'first name': first_name = '', 'profile pic url': profile_pic_url = '', 'chatfuel user id': chatfuel_user_id = 1000 } = req.body;

        User.findOrCreate({
            where: {
                chatfuel_user_id
            },
            defaults: {
                last_name,
                first_name,
                gender,
                profile_pic_url
            }
        }).spread(function(user, created) {
            if (!created) user.update({
                last_name,
                first_name,
                gender,
                profile_pic_url
            }, { where: {} })
        })

        /*======== Lưu xong ===========*/
        //Set JSON HEADER
        res.set({ 'Content-Type': 'application/json' });
        let userMessage = req.query.message;
        (async function xuly() {
            //Nếu thực hiện tra cứu thời khóa biểu bằng lệnh

            if (/^tkb/.test(userMessage)) {

                let studentDescribed = await Describe.findOne({
                    where: { chatfuel_user_id },
                    attributes: ['studentCode', 'studentName', 'done']
                })
                if (!studentDescribed) return res.send((new Chatfuel()).redirectToBlock(['nhap_info_sinhvien']));
                else if (studentDescribed.get({ plain: true }).done == false) return res.send((new Chatfuel()).sendText("Đang trong quá trình cập nhật").sendText("Thử lại sau vài giây").render());
                else return res.send((new Chatfuel()).redirectToBlock(['thoi_khoa_bieu']));
            }
            //Mặc định trả về tin nhắn cũ
            res.send((new Chatfuel()).sendText(userMessage).render());
        })()

    });

    router.get('/', function(req, res) {

        res.set({ 'Content-Type': 'application/json' });
        res.send((new Chatfuel()).sendText("Demo webhook!\nHỗ trợ Tiếng Việt!").render())
    })

    return router;
}
