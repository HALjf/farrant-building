# Farrant Building website

This repository is the source of [farrantbuilding.co.uk](https://farrantbuilding.co.uk). GitHub Pages publishes the `main` branch. The custom domain is set in `CNAME`.

## Where to edit

- Page copy: `index.html`
- Colours and layout: `styles.css`
- Behaviour: `script.js`
- Images and logo: `assets/`

## Colours

Set at the top of `styles.css`:

- Brick red: `#aa4a44` (`--brick`)
- Charcoal: `#222222` (`--ink`)
- Paper background: `#f6f3ee` (`--paper`)

## Type

`styles.css` sets one font stack, on `body`:

`"Montserrat", Arial, sans-serif`

Montserrat is loaded in `index.html` from Google Fonts, at weights 400, 500, 600, 700, and 800. `styles.css` applies weights 600, 700, and 800. Body copy leaves the weight unset, so it stays at 400.
