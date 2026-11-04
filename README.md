# Task Manager

A plain HTML, CSS and JavaScript task manager with persistent storage through the Supabase REST API. No installation or user login is required on the deployed site.

**Student:** Kateryna Kalyna  
**Student ID:** 72354  
**Course:** Team Project – IT, Practical Assignment 1

## Public resources

- Application: https://vistula-team-project-72354.github.io/vistula-task-manager/
- Repository: https://github.com/vistula-team-project-72354/vistula-task-manager
- Contributor page: https://vistula-team-project-72354.github.io/vistula-task-manager/contribution.html
- Contributor JSON: https://vistula-team-project-72354.github.io/vistula-task-manager/contribution.json

The main application is deployed on GitHub Pages. Contribution resources are published after the partner's Pull Request is merged.

## Features

- Read all tasks and retrieve a task by ID before editing.
- Create tasks with a required title and optional description.
- Edit titles and descriptions, mark tasks complete/incomplete, and delete tasks.
- Store all changes in PostgreSQL through Supabase REST endpoints.
- Display loading states, empty states, and useful errors.
- Responsive layout and keyboard-accessible controls. Task text is rendered as text, never HTML.

## Database setup

1. Create a separate demonstration Supabase project containing test data only.
2. In its SQL Editor run `schema.sql`. It creates `public.tasks`, enables RLS, grants table/sequence access to `anon`, and adds policies for public CRUD.
3. Copy the Project URL and **publishable** key (`sb_publishable_…`) from the project dashboard.
4. Fill in `config.json`:

```json
{
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabasePublishableKey": "sb_publishable_REPLACE_WITH_PUBLIC_KEY",
  "tableName": "tasks"
}
```

Only a public publishable key belongs here. Never commit database passwords, secret keys, or service role keys. All visitors can modify all demonstration tasks; do not store personal information.

## REST API

Requests go to `https://PROJECT.supabase.co/rest/v1/tasks` with an `apikey` header. The publishable key is not sent as a Bearer token.

| Action | Method | Query |
| --- | --- | --- |
| List tasks | GET | `?select=*&order=id.desc` |
| Get task | GET | `?id=eq.ID&select=*` |
| Create task | POST | none |
| Edit or toggle task | PATCH | `?id=eq.ID` |
| Delete task | DELETE | `?id=eq.ID` |

Mutations request `Prefer: return=representation` and use the server's returned records.

## GitHub Pages

Publish this repository under the dedicated account `vistula-team-project-72354` with the exact repository name `vistula-task-manager`. In Settings → Pages select **Deploy from a branch**, branch **main**, folder **/(root)**, and save.

For local development, serve this directory over HTTP (for example `python -m http.server 8000`) and open http://localhost:8000/. Opening `index.html` directly as a file will not allow configuration fetches.

## Team collaboration

Partner student ID: **71661**. The incoming `contribution.json` must contain `{"contributorStudentId":"71661"}`.

`contribution.html` and `contribution.json` must be supplied by the partner through a Pull Request from their dedicated account. Do not add these files directly to your own repository.

- Incoming PR by partner (71661): [Add contributor page — 71661](https://github.com/vistula-team-project-72354/vistula-task-manager/pull/1).
- Outgoing PR by 72354 to `vistula-team-project-71661/vistula-task-manager`: [Add contributor page — 72354](https://github.com/vistula-team-project-71661/vistula-task-manager/pull/1).

Each author forks the partner's repository, creates `feature/team-contribution`, adds only the two contribution files, pushes, and opens a Pull Request into the partner's `main`. The receiving repository owner reviews and merges it. If a same-named personal repository already exists, give the fork a different name such as `partner-task-manager-71661`.

## Verification before submission

1. Open the deployed site; create a uniquely named test task.
2. Refresh and confirm it persists.
3. Edit its title and description; refresh again.
4. Mark complete and incomplete; confirm both states persist.
5. Delete the test task and refresh to confirm it is gone.
6. Check error handling using the browser's offline mode, then reconnect and refresh.
7. Open the contribution page, click **Show Contributor**, and verify ID `71661` is loaded from the JSON file.
8. Confirm both linked PRs are merged by the receiving repository owners.

Submit only your own working application URL in Platon after all checks pass.
