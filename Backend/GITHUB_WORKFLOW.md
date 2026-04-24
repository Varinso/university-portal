GitHub Fork Workflow in VS Code

Use this workflow for your class submission.

1) Verify remotes
- git remote -v

Expected
- origin -> your fork
- upstream -> original project

If upstream is missing
- git remote add upstream https://github.com/MAIN_OWNER/MAIN_REPO.git

2) Sync your fork main branch
- git checkout main
- git fetch upstream
- git merge upstream/main
- git push origin main

3) Create backend feature branch
- git checkout -b backend-api

4) Commit in small parts
- git add Backend/package.json Backend/src/app.js Backend/src/server.js
- git commit -m "chore: scaffold backend express app"

- git add Backend/src/config Backend/src/middleware Backend/src/utils Backend/src/routes
- git commit -m "feat: add auth middleware and api routes"

- git add Backend/src/controllers Backend/db Backend/scripts
- git commit -m "feat: implement controllers migrations and seed"

- git add Backend/README.md Backend/GITHUB_WORKFLOW.md
- git commit -m "docs: add backend setup and github workflow"

5) Push your branch
- git push -u origin backend-api

6) Open Pull Request
- Base repo: original project (upstream)
- Base branch: main
- Head repo: your fork
- Compare branch: backend-api

7) Keep branch updated while PR is open
- git fetch upstream
- git checkout backend-api
- git merge upstream/main
- git push

8) If conflict happens
- Resolve files in VS Code Source Control
- git add <resolved-files>
- git commit
- git push

Tip
- Do not use force push unless your teacher or team explicitly asks for it.
