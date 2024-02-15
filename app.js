const express = require('express');
const app = express();
const warmUpReportRoute = require('./routes/warmUpReportRoute');
const bodyParser = require('body-parser');


app.use(bodyParser.json());

// Use warmUpReportRoute
app.use('/', warmUpReportRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
