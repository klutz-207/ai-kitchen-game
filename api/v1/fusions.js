const { handleApi, validationError } = require('../_lib/http');
const { fuseDishes } = require('../_lib/mock-service');

module.exports = (req, res) => {
  handleApi(req, res, 'POST', (body) => {
    if (!body.guestId) throw validationError('guestId is required.');
    if (!body.dish1 || !body.dish2) throw validationError('dish1 and dish2 are required.');

    return {
      finalDish: fuseDishes({
        guestId: body.guestId,
        dish1: body.dish1,
        dish2: body.dish2,
      }),
    };
  });
};
