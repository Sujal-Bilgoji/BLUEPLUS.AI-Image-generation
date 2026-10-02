module.exports = {
  HOURLY_IMAGE_LIMIT_PER_USER: 50, // images, not requests
  DAILY_IMAGE_LIMIT_PER_USER: 100,
  PER_MINUTE_LIMIT: 5,             // requests per minute
  GLOBAL_DAILY_CAP: 200,           // images per day, whole site
  MAX_PROMPT_LENGTH:1500,
  MAX_IMAGES_PER_REQUEST: 4,
  IMAGE_MODEL: '@cf/black-forest-labs/flux-2-klein-4b',
  ASPECT_RATIOS: {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
  },
};