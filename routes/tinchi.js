const router = require("express").Router();
const buildUrl = require("build-url");
const Chatfuel = require("chatfuel-helper");
const loginKMA = require("tin-chi-kma")({});

module.exports = function({ model, Op }) {
    router.post('/', function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id, tai_khoan_sinh_vien: user, mat_khau_sinh_vien: pass, URL_JSON_API: url_json_api } = req.body;
        loginKMA({ user, pass }, function(error, api) {
            if (error) return res.send((new Chatfuel()).sendText("Sai tài khoản / mật khẩu").redirectToBlock(["nhap_info_sinhvien"]));
            api.studyRegister.showCourse(function(courses) {
                let chatfuel = new Chatfuel();

                while (courses.length > 0) {
                    let elements = new Array();

                    courses.splice(0, 4).forEach(function(course) {
                        let buttons = [chatfuel.createButtonPostBack({
                            url: buildUrl(`${process.env.HTTPS == '0' ? 'http': 'https' }://${url_json_api}/tinchi/getcourse/`, {
                                queryParams: {
                                    chatfuel_user_id,
                                    user,
                                    pass,
                                    drpCourse: course.value,
                                    url_json_api
                                }
                            }),
                            title: "Đăng Ký"

                        })];
                        elements.push(chatfuel.createElement({ title: course.name, image_url: undefined, subtitle: undefined, buttons }))
                    });

                    chatfuel.sendLists({ elements });
                }
                res.send(chatfuel.render());
                //do something with `courses`
                /*
                courses là 1 mảng chứa các object {name:'Tên Môn HỌC', value:'Giá trị để sử dụng cho api lấy danh sách lớp'}
                */

            })
        })
    });

    router.post('/getcourse', function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id, user, pass, drpCourse, url_json_api } = req.query;
        // console.log({ user, pass, drpCourse, url_json_api });
        loginKMA({ user, pass }, function(error, api) {
            if (error) return res.send((new Chatfuel()).sendText("Sai tài khoản/ mật khẩu").redirectToBlock(["nhap_info_sinhvien"]).render());
            // return res.send((new Chatfuel()).sendText("Allo").render())
            api.studyRegister.getCourse({ drpCourse }, function(classes) {
                /*
                classes là mảng chứa các object về thông tin các lớp học*/
                let chatfuel = new Chatfuel();
                while (classes.length > 0) {
                    let elements = new Array();
                    classes.splice(0, 4).forEach(function(classInfo) {
                        let buttons = [chatfuel.createButtonPostBack({
                            url: buildUrl(`${process.env.HTTPS == '0' ? 'http': 'https' }://${url_json_api}/tinchi/regcourse/`, {
                                queryParams: {
                                    chatfuel_user_id,
                                    user,
                                    pass,
                                    drpCourse,
                                    url_json_api,
                                    valueInput: JSON.stringify(classInfo.valueInput)
                                }
                            }),
                            title: "Đăng ký lớp"
                        })];
                        elements.push(chatfuel.createElement({
                            title: classInfo.nameClass,
                            image_url: undefined,
                            subtitle: `Giáo viên: ${classInfo.teacher || '?'}\nSĩ số: ${classInfo.siso}\nSố ĐK: ${classInfo.soDK}`,
                            buttons
                        }))
                    });
                    chatfuel.sendLists({ elements });
                }
                return res.send(chatfuel.render())
            })
        })
    })

    router.post('/regcourse', function(req, res) {
        let { 'chatfuel user id': chatfuel_user_id, user, pass, drpCourse, valueInput } = req.query;
        // console.log({  user, pass, drpCourse, valueInput});
        loginKMA({ user, pass }, function(error, api) {
            if (error) return res.send((new Chatfuel()).sendText("Sai tài khoản/ mật khẩu").redirectToBlock(["nhap_info_sinhvien"]).render());
            return res.send((new Chatfuel()).sendText("Chưa đến giờ đăng ký hệ thống sẽ tự động đăng ký khi đến thời gian mở đăng ký").render())

        })
    })

    return router;
}
