const express = require('express');
const router = express.Router();
const warmUpReportController = require('../controller/warmUpReportController');

// Define route to generate CSV
router.get('/generate-csv', warmUpReportController.generateCsv);

module.exports = router;
