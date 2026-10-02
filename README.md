# BluePlus.AI

Free AI image generator built as a full-stack portfolio project.

**Live demo:** https://blueplus-ai.onrender.com

## Features
- Text-to-image with 12 style presets, 5 aspect ratios, and 1-4 images per request
- Reference-image upload with a text prompt
- Voice input (Web Speech API, Chrome and Edge)
- Guided prompt builder
- History saved in the browser (nothing is stored on the server)
- Per-user rate limiting (per minute, hour and day) plus a site-wide daily cap
- Handles provider errors: safety-filter blocks, quota limits and busy responses

## Tech stack
React, Vite, Tailwind CSS, Node.js, Express, Cloudflare Workers AI

## Notes
- The API key stays on the server and is never sent to the browser.
- Photos and prompts pass through the server to the image provider and are not stored.
- Some prompts may be blocked by the provider's safety filter.

## Run locally
1. `npm install` and `cd client && npm install`
2. Create `.env` with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
3. Run `node server.js` and, in a second terminal, `cd client && npm run dev`

## Credits
- Loader animation by Shoh2008 and "add" button by catraco, from Uiverse.io (MIT License)
- Fonts: Montserrat and Anton SC from Google Fonts (SIL Open Font License)
- Image generation: Cloudflare Workers AI (FLUX.2 klein)

## License
Copyright (c) 2026 [Sujal Appaya Bilgoji]. All rights reserved. Viewing only. See LICENSE.
