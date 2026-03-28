import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Apply both globally in app.js: app.use(...sanitiseInputs)
export const sanitiseInputs = [
  mongoSanitize(), // strips $ and . from keys to prevent NoSQL injection
  xss(), // escapes HTML special characters in values
];
