const express = require("express");
const bodyParser = require("body-parser");
// const chimp = require("./mailchimp.js.");
// constant

// var supersaas = require('supersaas-api-client');
// var Client = supersaas.Client;

const app = express();
const { google } = require("googleapis");
const request = require("request");
const urlParse = require("url-parse");
const queryParse = require("query-string");

const port = process.env.PORT || 5000;

// app.use(require(__dirname +"/routes/record"));
// get driver connection

const cors = require("cors");
const axios = require("axios");
const { json } = require("body-parser");
const { response } = require("express");

// 412564020124-qr6c7fsgafarqu442obmbtspl9e2k5p7.apps.googleusercontent.com
// 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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(chimp)


// var client = new Client({accountName: 'elitefit', api_key: 'xxOPAY4ssFR4UgSmO6_bkw'});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/login.html")
});

// backend for bmi calculation
app.get("/bmi", function (req, res) {

    // check this out change the file
    res.sendFile(__dirname + "/bmi.html")
});

app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/about_us.html")
})

app.get("/courses", (req, res) => {
    res.sendFile(__dirname + "/courses.html")
})

app.get("/slots", (req, res) => {
    res.sendFile(__dirname + "/slots.html")
})

app.post("/bmi.html", function (req, res) {
    console.log("post initiated");
    var Weight = Number(req.body.weight);
    var Height = Number(req.body.height);

    var bmi = Weight / (Height * Height);
    var range;
    if (bmi < 19) {
        range = "underweight";
    } else if (bmi > 19 && bmi < 25) {
        range = "normal";
    } else if (bmi > 25 && bmi < 30) {
        range = "overweight";
    } else {
        range = "obese";
    }

    var bmiResponse = {
        val: bmi,
        comment: range
    }
    res.send(bmiResponse);
});

// Oauth login google

app.get("/login", (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        "412564020124-qr6c7fsgafarqu442obmbtspl9e2k5p7.apps.googleusercontent.com",
        "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",
        "http://localhost:3000/fit-dash"
    )

    const scopes = ["https://www.googleapis.com/auth/fitness.activity.read profile email openid"];
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: json.toString({
            callbackUrl: req.body.callbackUrl,
            userID: req.body.userid
        })
    });

    request(url, (err, response, body) => {
        console.log("error", err);
        console.log(response && response.statusCode);
        // json.parse(url);
        res.redirect(url);
    });
});


// redirect to google fit dashboard
app.get("/fit-dash", async (req, res) => {
    const queryURL = new urlParse(req.url);
    const code = queryParse.parse(queryURL.query).code;
    const oauth2Client = new google.auth.OAuth2(
        "412564020124-qr6c7fsgafarqu442obmbtspl9e2k5p7.apps.googleusercontent.com",
        "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",
        "http://localhost:3000/fit-dash"
    )
    const tokens = await oauth2Client.getToken(code);


    let stepArray = [];

    try {
        const result = await axios({
            method: "POST",
            headers: {
                authorization: "Bearer " + tokens.tokens.access_token
            },
            "Content-type": "application/json",
            url: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            data: {
                aggregateBy: [
                    {
                        dataTypeName: "com.google.step_count.delta",
                        dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
                    },
                ],
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis: 1585785599000,
                endTimeMillis: 1585958399000,
            },
        });

        stepArray = result.data.bucket;
        res.send(stepArray);
    } catch (e) {
        // console.log(e);
    }

    var step = [];

    try {
        for (const dataSet of stepArray) {
            for (const points of dataSet.dataset) {
                for (const steps of points.point) {
                    // this console logs the step count
                    res.send(steps.value)
                    steps.append(steps.value)
                }
            }
        }
    } catch (error) {

    }
});

app.post("./fit-dash.html", function (req, res) {

})

app.get("/profile", (req, res) => {

})

// app.get("/slots", (req, res) => {
//     // https://www.supersaas.com/form/elitefit/signup
//     // link to signup form
//     //http://www.supersaas.com/schedule/elitefit/sessions
//     // link to session booking
//     // slot file goes here. Use the sass
//     res.sendFile(__dirname + "/slots.html")
// });

// port config
app.listen(3000, function () {
    console.log("server started on port ${port}");
});
