const fetch = require('node-fetch');
const parse = require('url-parse');
const {URLSearchParams} = require('url');

const wiOrigin = process.env.wi_origin;
const apiOrigin = process.env.api_origin
const inspectUrl = process.env.inspect_url;

const projectName = process.env.project_name;
const verbose = process.env.verbose === 'true';

const gl = {
  apiToken: null,
  scanId: null
}


async function apiGet(path, headers) {
  if (!headers) {
    headers = {};
  }
  headers['Authorization'] = `Bearer ${gl.apiToken}`;
  const opts = {headers}
  const response = await fetch(apiOrigin + path, opts)
  return await response.json()
}

async function apiPost(path, headers, bodyForm) {
  if (!headers) {
    headers = {};
  }
  headers['Authorization'] = `Bearer ${gl.apiToken}`;
  const params = new URLSearchParams();
  for (let key in bodyForm) {
    params.append(key, bodyForm[key])
  }
  const opts = {method: 'POST', headers, body: params}
  const response = await fetch(apiOrigin + path, opts)
  return await response.json()
}

async function wiGet(path, headers) {
  if (!headers) {
    headers = {};
  }
  const opts = {headers}
  const response = await fetch(apiOrigin + path, opts)
  return await response.json()
}

async function wiPost(path, headers, bodyForm) {
  if (!headers) {
    headers = {};
  }
  const params = new URLSearchParams();
  for (let key in bodyForm) {
    params.append(key, bodyForm[key])
  }
  const opts = {method: 'POST', headers, body: params}
  const response = await fetch(apiOrigin + path, opts)
  return await response.json()
}

// ------------------- Routine Start -------------------

await createScan()

async function createScan() {
  const bodyForm = {
    "settingsName": "Default",
    "overrides": {
      "scanName": projectName,
      "startUrls": [inspectUrl],
      "scanScope": "children"
    },
    "CrawlAuditMode": "CrawlAndAudit"
  }
  const res = wiPost('/scanner/scans', {}, bodyForm)
  console.log(res)
  gl.scanId = res['ScanId']
  console.log(gl.scanId)
}