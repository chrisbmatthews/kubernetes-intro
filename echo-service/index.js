const express = require('express');
const os = require('os');

//init express...
const app = express();
app.use(express.json()) // for parsing application/json
const port = 8080;

app.get('/echo/*', (req, res) => {
    let hostname = os.hostname();
    console.log(req.params);
    res.send({
        echo: req.params,
        hostname: hostname
    });
});

app.listen(port, () => {
    console.log('Echo Service started on port ' + port);
});