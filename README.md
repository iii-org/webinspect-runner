# webinspect-runner
Runner for WebInspect

# Usage
```bash
$ docker pull iiiorg/webinspect-runner
# Or use .env file by docker run --env-file=.env
$ ln -s <Directory want to be scanned> repo
$ docker run \ 
  --env wi_base_url=http://127.0.0.1:14198/webinspect \ # The base URL of WebInspect
  --env inspect_url=http://localhost:14444/ \ # The URL to inspect
  --env project_name=full-test \ # The project name
  --env git_branch=master \ # Indicates the tested branch name 
  --env git_commit_id=aec8d49b \ # Indicates the tested commit
  --env api_origin=http://10.50.1.66:10009 \ # Origin of the API server
  --env api_username=<username> \ # username of the API server
  --env api_password=<password> \ # password of the API server
  --env verbose=true \ # [Optional] If you want detailed log
  iiiorg/webinspect-runner
``` 

