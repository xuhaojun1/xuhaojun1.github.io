# Direct Forcing project page

Static academic project page for **Direct Forcing: Single-Stage Training with Representation-Space Supervision for Few-Step Autoregressive Video Generation**.

- Project page: <https://xuhaojun1.github.io/Direct-Forcing/>
- Code: <https://github.com/xuhaojun1/Direct-Forcing>
- Paper: <https://arxiv.org/abs/2610.30861>

## Local preview

From this directory:

```bash
python3 scripts/preview.py --port 8766
```

Open <http://127.0.0.1:8766/>. The server binds only to the local computer. Choose another port if it is already in use. No build, package installation, remote fonts or analytics are required.

## Edit

- `index.html`: paper information, method and result tables, citation.
- `static/css/project.css`: layout and typography.
- `static/js/project.js`: lazy previews and video dialogs.
- `data/gallery.json` and `data/gallery-data.js`: the same ordered gallery metadata. Keep them synchronized.
- `static/videos/` and `static/posters/`: the 20 selected generations and thumbnails.
- `static/figures/`: method figure, training curve, favicon and social preview.
- `data/benchmark.json` and `data/training-progress.json`: the reported result data.
- `site.json`: code-repository and GitHub Pages configuration.

Check the public files before publishing:

```bash
python3 scripts/check_site.py
```

## GitHub Pages

The page lives in `Direct-Forcing/` on the `master` branch of [the personal-site repository](https://github.com/xuhaojun1/xuhaojun1.github.io). Training code lives separately in [Direct-Forcing](https://github.com/xuhaojun1/Direct-Forcing).

The personal site uses Jekyll. Keep this project's HTML and assets inside this folder; do not add `.nojekyll` at the personal-site repository root or replace its existing configuration. Resource URLs are relative, while canonical and social-preview URLs use the unchanged `/Direct-Forcing/` address.

Only public material belongs here. Do not commit review pages, candidate clips, experiment paths, credentials or model weights. Push updates normally to the personal-site repository, without rewriting its history.

## Attribution

Layout adapted and simplified from [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template), under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Bulma is distributed under the MIT license. These component notices do not independently assign a license to model weights or generated media.
