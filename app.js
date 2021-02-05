const fetch = require('node-fetch');
const parse = require('url-parse');
const {URLSearchParams} = require('url');

const webServiceName = process.env.web_service_name;
const wiOrigin = process.env.wi_base_url;
const apiOrigin = process.env.api_origin
let inspectUrl = process.env.inspect_url;
const gitUrl = process.env.git_url;
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
    opts.body = JSON.stringify(bodyForm)
    headers['Content-Type'] = 'application/json'
  }
  if (verbose) {
    console.log('url=', url);
    console.log('opts=', opts.body);
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
    console.error(await response.text());
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

if (verbose) {
  console.log('runner version 1.0.1')
}

(async () => {
  await apiLogin()
  await ensureInspectUrl()
})()

async function ensureInspectUrl() {
  if (!inspectUrl) {
    if (verbose) console.log('Retrieving repo_id...')
    await apiGet(`/repositories/id?repository_url=${decodeURIComponent(gitUrl)}`)
      .then(async function(json) {
        if (verbose) console.log('resp=', json)
        repository_id = json.data.repository_id
        if (verbose) {
          console.log('repo_id is ' + repository_id)
          console.log('Retrieving inspect url...')
        }
        await apiGet(`/repositories/${repository_id}/branches`).then(json => {
          if (verbose) console.log('resp=', json)
          const branches = json.data.branch_list
          for (let i in branches) {
            const b = branches[i]
            if (gitBranch != b.name) continue
            for (let j in b.env_url) {
              const o = b.env_url[j]
              for (let key in o) {
                if (key == webServiceName) {
                  inspectUrl = o[key][0].url
                  break
                }
              }
            }
          }
          createScan()
        })
      })
  } else {
    createScan()
  }
}

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

async function apiLogin() {
  const res = await apiPost('/user/login', {}, {
    username: process.env['api_username'],
    password: process.env['api_password']
  })
  gl.apiToken = res.data.token;
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
