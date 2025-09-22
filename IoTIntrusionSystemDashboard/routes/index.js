var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { 
    title: 'IoT Intrusion Detection System',
    pageTitle: 'Welcome to IoT Security',
    features: [
      {
        icon: '🛡️',
        title: 'Real-time Monitoring',
        description: 'Monitor your IoT devices 24/7 with advanced threat detection'
      },
      {
        icon: '🔒',
        title: 'Secure Authentication',
        description: 'Multi-factor authentication to protect your dashboard access'
      },
      {
        icon: '📊',
        title: 'Detailed Analytics',
        description: 'Comprehensive reports and analytics on security events'
      },
      {
        icon: '⚡',
        title: 'Instant Alerts',
        description: 'Get notified immediately when threats are detected'
      }
    ]
  });
});

module.exports = router;
