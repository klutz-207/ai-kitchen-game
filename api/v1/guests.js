const { handleApi } = require('../_lib/http');
const { getGuests } = require('../_lib/mock-service');

module.exports = (req, res) => {
  handleApi(req, res, 'GET', () => ({
    guests: getGuests(),
  }));
};
