"use strict";
let request = require('request-promise')
    .defaults({
        transform: function(body) {
            return JSON.parse(body);
        }
    });
module.exports = ({ DETECT_FACE_KEY, HOST = `westcentralus.api.cognitive.microsoft.com` }) => function(imageUrl) {
    const options = {
        uri: `https://${HOST}/face/v1.0/detect`,
        qs: {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
            'returnFaceAttributes': ["age", "gender", "headPose", "smile", "facialHair", "glasses", "emotion", "hair", "makeup", "occlusion", "accessories", "blur", "exposure", "noise"].join(",")
        },
        body: `{"url": "${imageUrl}"}`,
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': DETECT_FACE_KEY
        }
    };

    return request.post(options)
        .then(function(faceDetect) {
            if (!faceDetect.length || faceDetect.length == 0) return Promise.reject("Không có khuôn mặt trong hình");
            return faceDetect.map(function({ faceAttributes }) {

                let { gender, age, glasses, makeup, emotion = {}, noise, hair } = faceAttributes;

                return {
                    gender,
                    age,
                    haveGlasses: glasses != "NoGlasses",
                    noise: noise && noise.noiseLevel,
                    makeup,
                    hairColor: hair && hair.hairColor && hair.hairColor[0] && hair.hairColor[0].color,
                    emotion: Object.keys(emotion).sort((a, b) => emotion[b] - emotion[a])[0]
                }
            })
        })
}
