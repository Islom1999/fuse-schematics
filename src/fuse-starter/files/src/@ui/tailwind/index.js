// @ts-check
/** Tailwind plugins and helpers of the UI kit, for `tailwind.config.js` (CommonJS, build time). */
const { generatePalette, contrastPalette } = require('./color')
const { uiTheming, themeColors } = require('./theming')
const { uiUtilities } = require('./utilities')
const { uiIconSize } = require('./icon-size')

module.exports = { uiTheming, uiUtilities, uiIconSize, generatePalette, contrastPalette, themeColors }
