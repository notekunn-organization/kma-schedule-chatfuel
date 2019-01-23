"use strict";
let request = require('request-promise')
    .defaults({
        transform: function(body) {
            return JSON.parse(body);
        }
    });
module.exports = ({ DETECT_IMAGE_KEY, HOST = `westcentralus.api.cognitive.microsoft.com` }) => function(imageUrl) {
    const options = {
        uri: `https://${HOST}/vision/v2.0/analyze`,
        qs: {
            'visualFeatures': 'Categories,Description,Color',
            'details': '',
            'language': 'en'
        },
        body: '{"url": ' + '"' + imageUrl + '"}',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': DETECT_IMAGE_KEY
        }

    };

    return request.post(options)
        .then(function({description}) {
            if(!description || !description.captions || description.captions.length == 0) return Promise.reject("Không thể nhận diện hình ảnh");
            return description.captions.map(e => e.text);            
        })
}
