require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'client', 'dist')));

const perMinute = rateLimit({
  windowMs: 60 * 1000,
  limit: config.PER_MINUTE_LIMIT,
  message: { error: 'Slow down! Please wait a minute.' },
});

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const userHourly = new Map();
const userDaily = new Map();
let dailyCount = 0;
let dayStart = Date.now();

function getEntry(map, ip, windowMs) {
  const now = Date.now();
  let e = map.get(ip);
  if (!e || now > e.resetAt) {
    e = { used: 0, resetAt: now + windowMs };
    map.set(ip, e);
  }
  return e;
}

function reserve(ip, count) {
  const now = Date.now();
  if (now - dayStart > DAY) {
    dayStart = now;
    dailyCount = 0;
  }
  if (dailyCount + count > config.GLOBAL_DAILY_CAP) return 'global';
  const h = getEntry(userHourly, ip, HOUR);
  const d = getEntry(userDaily, ip, DAY);
  if (d.used + count > config.DAILY_IMAGE_LIMIT_PER_USER) return 'daily';
  if (h.used + count > config.HOURLY_IMAGE_LIMIT_PER_USER) return 'hourly';
  h.used += count;
  d.used += count;
  dailyCount += count;
  return 'ok';
}

function refund(ip, count) {
  for (const m of [userHourly, userDaily]) {
    const e = m.get(ip);
    if (e) e.used = Math.max(0, e.used - count);
  }
  dailyCount = Math.max(0, dailyCount - count);
}

function detectMime(base64) {
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

// null = no image, false = invalid, Buffer = valid JPEG up to 1 MB
function parseImage(dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return false;
  const buf = Buffer.from(m[1], 'base64');
  return buf.length <= 1024 * 1024 ? buf : false;
}

async function generateOne(prompt, width, height, ref) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${config.IMAGE_MODEL}`;
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', String(width));
  form.append('height', String(height));
  if (ref) form.append('input_image_0', new Blob([ref], { type: 'image/jpeg' }), 'input.jpg');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    body: form,
  });

  if (res.status === 429) {
    const text = await res.text();
    console.error(text);
    const err = new Error('busy');
    err.status = 429;
    err.quota = text.includes('Neuron limit');
    throw err;
  }
    if (!res.ok) {
    const text = await res.text();
    console.error(text);
    const err = new Error('service error');
    if (text.includes('"code":3030')) err.flagged = true;
    throw err;
  }

  const type = res.headers.get('content-type') || '';
  if (type.startsWith('image/')) {
    return { mime: type, data: Buffer.from(await res.arrayBuffer()).toString('base64') };
  }
  const json = await res.json();
  const base64 = json.result && json.result.image;
  if (!base64) throw new Error('no image returned');
  return { mime: detectMime(base64), data: base64 };
}

app.post('/api/generate', perMinute, async (req, res) => {
  const prompt = (req.body.prompt || '').trim();
  if (!prompt || prompt.length > config.MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `Prompt must be 1-${config.MAX_PROMPT_LENGTH} characters.` });
  }

  const ref = parseImage(req.body.image);
  if (ref === false) {
    return res.status(400).json({ error: 'Invalid reference image. Use a JPEG under 1 MB.' });
  }

  const count = Math.min(
    Math.max(parseInt(req.body.count, 10) || 1, 1),
    config.MAX_IMAGES_PER_REQUEST
  );
  const size = config.ASPECT_RATIOS[req.body.ratio] || config.ASPECT_RATIOS['1:1'];

  const status = reserve(req.ip, count);
  if (status === 'global') {
    return res.status(503).json({ error: 'Site daily limit reached. Come back tomorrow!' });
  }
  if (status === 'daily') {
    return res.status(429).json({
      error: `Daily limit of ${config.DAILY_IMAGE_LIMIT_PER_USER} images reached. Come back tomorrow.`,
    });
  }
  if (status === 'hourly') {
    return res.status(429).json({
      error: `Hourly limit of ${config.HOURLY_IMAGE_LIMIT_PER_USER} images reached. Try again later.`,
    });
  }

  const results = await Promise.allSettled(
    Array.from({ length: count }, () => generateOne(prompt, size.width, size.height, ref))
  );

  const images = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = count - images.length;
  if (failed > 0) refund(req.ip, failed);

    if (images.length === 0) {
      if (results.some((r) => r.reason && r.reason.flagged)) {
        return res.status(422).json({
        error: 'That prompt or photo was blocked by the safety filter. Try rewording it.',
      });
    }
        if (results.some((r) => r.reason && r.reason.quota)) {
      return res.status(429).json({
        error: 'The free daily image allowance is used up. It resets at 5:30 AM IST.',
      });
    }
    const busy = results.some((r) => r.reason && r.reason.status === 429);
    return res.status(busy ? 429 : 502).json({
      error: busy
        ? 'The image service is busy or the daily quota is used up.'
        : 'Image service error. Please try again.',
    });
  }

  res.json({ images, failed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));