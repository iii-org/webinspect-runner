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


async function doRequest(method, url, headers, bodyForm) {
  if (!headers) {
    headers = {};
  }
  const opts = {headers}
  opts.method = method
  if (bodyForm) {
    const params = new URLSearchParams();
    for (let key in bodyForm) {
      params.append(key, bodyForm[key])
    }
    opts.body = params
  }
  try {
    const response = await fetch(url, opts)
    return await response.json()
  } catch (err) {
    console.error(err.stack)
    process.exit(1)
  }
}

async function apiGet(path, headers) {
  if (!headers) {
    headers = {};
  }
  headers['Authorization'] = `Bearer ${gl.apiToken}`;
  return await doRequest('GET', apiOrigin + path, headers)
}

async function apiPost(path, headers, bodyForm) {
  if (!headers) {
    headers = {};
  }
  headers['Authorization'] = `Bearer ${gl.apiToken}`;
  return await doRequest('POST', apiOrigin + path, headers, bodyForm)
}

async function wiGet(path, headers) {
  return await doRequest('GET', wiOrigin + path, headers)
}

async function wiPost(path, headers, bodyForm) {
  return await doRequest('POST', wiOrigin + path, headers, bodyForm)
}

// ------------------- Routine Start -------------------

(async () => {
  await createScan()
})()

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
  const res = await wiPost('/scanner/scans', {}, bodyForm)
  console.log(res)
  gl.scanId = res['ScanId']
  console.log(gl.scanId)
}