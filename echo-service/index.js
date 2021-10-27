const express = require('express');
const os = require('os');

//init express...
const app = express();
app.use(express.json()) // for parsing application/json
const port = 8080;

app.get('/echo/*', (req, res) => {
    //get the hostname...
    let hostname = os.hostname();

    //get a message from the MY_MESSAGE environment variable...
    let envMessage = process.env.MY_MESSAGE;
    console.log(req.params);

    //send a response back...
    res.send({
        echo: req.params,
        envMessage: envMessage,
        hostname: hostname
    });
});

app.listen(port, () => {
    console.log('Echo Service started on port ' + port);
});