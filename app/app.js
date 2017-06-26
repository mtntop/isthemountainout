"use strict";

// Load keys
const secrets = require('../secrets');

// Express & Socket.io setup
const express = require('express');
const ejs = require('ejs');
const app = express();
const https = require('https');
const http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
server.listen(3000, function () {
    console.log('The Mountain is listening on port 3000')
})

// ImageMagick setup
const gm = require('gm').subClass({imageMagick: true});
require('gm-base64');

// Clarifai setup
const clarifai = require('clarifai');
const sauron = new clarifai.App(
    secrets.clarifai.client_id,
    secrets.clarifai.client_secret
);

// WebHooks setup
const WebHooks = require('node-webhooks');
const webHooks = new WebHooks({
    db: './../webHooksDBProduction.json', // json file that store webhook URLs
});

// Misc
const request = require('request');
const moment = require('moment-timezone');

// Current Data
let current_result = false;
let url_of_image = '';

io.on('connection', function (socket) {
    socket.emit('mountainChange', { result: current_result });
});

app.set('view engine', 'ejs');
app.use(express.static('lib'));
app.get('/!', (req, res) => {
    let ua = req.headers['user-agent'];
    console.log(ua);
    if(/curl|powershell/i.test(ua))
        res.send((current_result ? mountain : no));
    else
        res.render('downmtn');
})

// For the ASCII Art
app.get('/', (req, res) => {
    let ua = req.headers['user-agent'];
    console.log(ua);
    if(/curl|powershell/i.test(ua))
        res.send((current_result ? mountain : no));
    else
        res.send(formatForBrowser(current_result ? mountain : no));
});

// For the JSON response
app.get('/api', (req, res) => {
    let obj = {
        result: current_result,
        image: url_of_image
    };
    res.json(obj);
});

// For the status codes response
app.get('/api/simple', function (req, res) {
    res.sendStatus((current_result ? 200 : 404));
});

// Background Worker - CRON job
function process() {
    // format url (get time in Seattle, get time on the 10th minute - aka floor minutes, build url)
    var time = moment().tz('America/Los_Angeles').format('YYYY_MM_DD/HHmm');
    var timeFloored = time.substr(0, time.length - 1) + "0";
    var url = "https://ismtrainierout.com/timelapse/" + timeFloored + ".jpg";

    // An example of an image with the mountain in it
    // url = 'https://ismtrainierout.com/timelapse/2017_06_10/0710.jpg';

    https.get(url, function(res) {
        console.log(timeFloored +': '+res.statusCode);

        // Only process an image if it exists
        if(res.statusCode == 200){
            url_of_image = url;
            containsMountain(url);
        }
    });
}

setInterval(process, 600000)
process()

// Processes if there is a mountain in the image url
function containsMountain(url) {
    gm(request(url))
    .crop(178, 100, 296, 119)
    .toBase64('png', (err, base64) => {
        sauron.models.predict(clarifai.GENERAL_MODEL, {base64: base64}).then(
            response => {
                var list = response.outputs[0].data.concepts;
                var found = false;
                for(var i = 0; i < list.length; i++) {
                    if (list[i].name.toLowerCase() == 'mountain') {
                        found = true;
                        break;
                    }
                }
                console.log('Found: ' + found);

                if (current_result != found) {
                    let obj = {
                        result: current_result,
                        image: url_of_image
                    };
                    webHooks.trigger('mountainChange', obj);
                    io.emit('mountainChange', obj);
                    if (found) {
                        webHooks.trigger('mountainIsOut', obj);
                        io.emit('mountainIsOut', obj);
                    }
                }
                current_result = found;
            },
            err => {
                console.log(JSON.stringify(err));
            }
        );
    });
}

function formatForBrowser(result) {
    return `
<html>
<head>
<style>
body {
    background-color: black;
}
pre {
    color: white;
    font-family: monospace;
    vertical-align: middle;
    margin: 0 auto;
    padding: 14px;
    width: 483px;
    margin-top: 200px;
    border: white solid 1px;
}
a {
    text-decoration: none;
}
</style>
</head>
<body>
<a href="/!">
<pre>
${result}
</pre>
</a>
</body>
</html>
`
}

const mountain = `
                        ,sdPBbs.
                      ,d$$$$$$$$b.
                     d$P''Y''Y''?$b
                    d'    '  '  \\ 'b      The mountain is out!
                   /    |        \\  \\
                  /    / \\       |   \\
             _,--'        |      \\    |
           /' _/          \\   |        \\
        _/' /'             |   \\        '-.__
    __/'       ,-'    /    |    |     \\      '--...__
  /'          /      |    / \\     \\     '-.           '\\
 /    /;;,,__-'      /   /    \\            \\            '-.
/    |;;;;;;;\\                                             \\
`

const no = `
            The mountain is not out.
                _
              ('  ).                   _
             (     ).              .:('  )'.
)           _(       ''.          :(   .    )
        .=('(      .   )     .--  '.  (    ) )
       ((    (..__.:'-'   .+(   )   ' _'  ) )
'.     '(       ) )       (   .  )     (   )  ._
  )      ' __.:'   )     (   (   ))     '-'.-('  )
)  )  ( )       --'       '- __.'         :(      ))
.-'  (_.'          .')                    '(    )  ))
                  (_  )                     ' __.:'
`
