# stevej.ca

Personal website for Steve Jones. A single static page with no build step and no cookies. Fonts, images and scripts are all self-hosted. The only outside request is an anonymous page-view count sent to GoatCounter.

## Structure

```
index.html              All content (one page, one section per topic)
css/styles.css          Styles; colour tokens at the top, dark mode via prefers-color-scheme
js/main.js              Optional enhancements: active nav link, photo carousel controls, full-screen viewer
fonts/                  Inter variable font (self-hosted)
img/                    Portrait, book cover, section photos, social share image
img/gallery/NN.jpg      Full-size gallery photos (1800px long edge)
img/gallery/NN-thumb.jpg  Carousel images for smaller screens (720px long edge)
img/gallery/NN-mini.jpg   Thumbnail strip (240x160)
CNAME                   (added by GitHub when the custom domain is set)
```

## Editing

Edit `index.html` directly. Each section is commented (`<!-- Leadership -->`, `<!-- Author -->`, …).

### Add a photo to the carousel

1. Export three JPEGs (strip location metadata when you export):
   - `img/gallery/39.jpg`, about 1800px on the long edge (full screen)
   - `img/gallery/39-thumb.jpg`, about 720px (the carousel on smaller screens)
   - `img/gallery/39-mini.jpg`, about 240×160 (the thumbnail strip)
2. In `index.html`, copy the last `car-slide` line and the last `car-thumb` line and update the number and description. `width`/`height` are the `-thumb.jpg` image's pixel size. Update the "N of 38" label too:

```html
<li class="car-slide" aria-roledescription="slide" aria-label="39 of 39"><a href="img/gallery/39.jpg"><img src="img/gallery/39-thumb.jpg" srcset="img/gallery/39-thumb.jpg 720w, img/gallery/39.jpg 1800w" sizes="(max-width: 1120px) 100vw, 1080px" width="720" height="480" alt="Describe the photo" loading="lazy" decoding="async"></a></li>
```
```html
<button class="car-thumb" type="button" aria-label="Show photo 39: Describe the photo"><img src="img/gallery/39-mini.jpg" alt="" loading="lazy" decoding="async"></button>
```

The counter and captions are generated from these automatically.

## Visitor stats

GoatCounter (cookie-free) records anonymous page views. Dashboard: https://stevej.goatcounter.com

- `js/goatcounter.js` is a self-hosted copy of https://gc.zgo.at/count.js (ISC license). Re-download it occasionally to pick up updates.
- Visits from localhost aren't counted.
- To stop counting your own visits, open https://stevej.ca/#toggle-goatcounter once in each browser you use.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

GitHub Pages serves the `main` branch root. Commit and push, and the site updates within a minute or two.

Until the custom domain is set, the site is at https://jonessteven.github.io/stevejwebsite/.

To switch stevej.ca over:

1. Set the custom domain with `gh api -X PUT repos/JonesSteven/stevejwebsite/pages -f cname=stevej.ca`, or in Settings → Pages.
2. Update DNS at the registrar:

| Type  | Host | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | jonessteven.github.io  |

Once the certificate is issued, enable "Enforce HTTPS" in the repo's Settings → Pages.
