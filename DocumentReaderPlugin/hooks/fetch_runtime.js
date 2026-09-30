#!/usr/bin/env node
/**
 * before_plugin_install: keep documentreadersdk.aar when it is already in
 * this plugin. Download the v1.0.0 Release only when it is missing.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const aar = path.join(root, 'src', 'android', 'documentreadersdk.aar');

function present(file) {
  try {
    return fs.statSync(file).size > 1024;
  } catch (e) {
    return false;
  }
}

if (present(aar)) {
  process.exit(0);
}

const url =
  'https://github.com/identixia-IDV/ID-Document-Recognition-Liveness-Detection-Android/releases/latest/download/documentreadersdk.aar';
const dest = aar;

function download(from, to) {
  return new Promise((resolve) => {
    const req = https.get(from, { timeout: 8000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, to).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }
      fs.mkdirSync(path.dirname(to), { recursive: true });
      const out = fs.createWriteStream(to);
      res.pipe(out);
      out.on('finish', () => resolve(true));
      out.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

download(url, dest).then(() => process.exit(0));
