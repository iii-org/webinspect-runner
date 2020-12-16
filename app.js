const fetch = require('node-fetch');
const parse = require('url-parse');
const {URLSearchParams} = require('url');

const wiOrigin = process.env.wi_base_url;
const apiOrigin = process.env.api_origin
const inspectUrl = process.env.inspect_url;
const gitBranch = process.env.git_branch;
const gitCommitId = process.env.git_commit_id;

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
    if (!response.ok) {
      console.error('Response status code is not 2xx for ' + url)
      console.error(response.status)
      console.error(await response.text())
      process.exit(1)
    }
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
  if (verbose) {
    console.log('Creating scan...')
    console.log('body=', bodyForm)
  }
  const res = await wiPost('/scanner/scans', {}, bodyForm)
  await writeToDB(res['ScanId'])
}

async function writeToDB(scanId) {
  const bodyForm = {
    scan_id: scanId,
    project_name: projectName,
    branch: gitBranch,
    commit_id: gitCommitId
  }
  if (verbose) {
    console.log('Writing into DB...')
    console.log('body=', bodyForm)
  }
  await apiPost('/webinspect/create_scan', {}, bodyForm)
  if (verbose) console.log('Job done.')
}
