const { body } = require('express-validator');

const encryptValidation = [
  body('password')
    .isString().withMessage('Password must be a string')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 256 }).withMessage('Password too long')
];

const vaultSaveValidation = [
  body('siteName')
    .isString().withMessage('Site name must be a string')
    .notEmpty().withMessage('Site name is required')
    .trim()
    .isLength({ max: 100 }).withMessage('Site name too long'),
  body('category')
    .isIn(['email', 'banking', 'social_media', 'work', 'others', 'other', 'shopping', 'entertainment'])
    .withMessage('Invalid category'),
  body('saveType')
    .isIn(['original', 'encrypted', 'both'])
    .withMessage('Invalid save type'),
  body('originalPassword')
    .isString().withMessage('Password must be a string')
    .notEmpty().withMessage('Password is required'),
  body('masterPassword')
    .optional()
    .isString().withMessage('Master password must be a string'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage('Notes too long')
];

const vaultRevealValidation = [
  body('id')
    .isUUID().withMessage('Invalid password ID'),
  body('masterPassword')
    .isString().withMessage('Master password must be a string')
    .notEmpty().withMessage('Master password is required')
];

const vaultDeleteValidation = [
  body('id')
    .isUUID().withMessage('Invalid password ID')
];

const aiSuggestValidation = [
  body('password')
    .isString().withMessage('Password must be a string')
    .notEmpty().withMessage('Password is required'),
  body('strength')
    .isObject().withMessage('Strength object is required')
];

const profileSetupValidation = [
  body('masterPassword')
    .isString().withMessage('Master password must be a string')
    .notEmpty().withMessage('Master password is required')
    .isLength({ min: 8 }).withMessage('Master password must be at least 8 characters')
];

const changeMasterPasswordValidation = [
  body('currentPassword')
    .isString().withMessage('Current password must be a string')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString().withMessage('New password must be a string')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

module.exports = {
  encryptValidation,
  vaultSaveValidation,
  vaultRevealValidation,
  vaultDeleteValidation,
  aiSuggestValidation,
  profileSetupValidation,
  changeMasterPasswordValidation
};
