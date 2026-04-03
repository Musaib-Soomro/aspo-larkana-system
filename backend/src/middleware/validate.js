/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 * On failure, responds 400 with { success: false, error, details }.
 */
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
}

module.exports = validate;
