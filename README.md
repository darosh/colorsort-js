# colorsort-js

> Various color sorting methods<br>
> Inspired by [work](https://codepen.io/meodai/full/mdpNJQQ) of David Aerne and his intriguing [question](https://bsky.app/profile/meodai.bsky.social/post/3mb7kea5ubk2v):<br> 
> _What is the “smoothest” order of colors?_

## Library 

[./packages/colorsort](./packages/colorsort)

## R&D Sandbox

- Homepage with test palettes and sorting results [darosh.github.io/colorsort-js](https://darosh.github.io/colorsort-js/)
  - The app has two views: above and bellow 1600px screen width - you need to zoom in/out a bit to switch the view
  - Click on row shows 3D/2D preview (mouse over on sorted palette in the right column changes the 3D/2D preview)
  - Shift + click on sorted palette sorts the table by fingerprint similarity  
  - Alt + click on sorted palette opens editor preview - which is completely off-topic attempt to use FFT and inverse FFT for processing the palette in spectral domain (like audio signal), but is has few additional features:
    - Click on palette prints the colors and fingerprint info to browser console
  - There are various filters available, see "Palette" and "Method" search box (?) hint for more info, notably:
    - [Method $](https://darosh.github.io/colorsort-js/#/?m=%24): manually selected best methods
    - [Method ?](https://darosh.github.io/colorsort-js/#/?m=%3F): automatically selected methods (marked by green lightbulb in the Method column)
- Stats page [darosh.github.io/colorsort-js/#/stats](https://darosh.github.io/colorsort-js/#/stats) shows the best methods candidates and test set coverage
