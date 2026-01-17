// geckodriver-path.cjs
const path = require('path');

module.exports = path.dirname(require.resolve('geckodriver'));
