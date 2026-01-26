# colorsort

> Various color sorting method. Find out more info in the [research repository](https://github.com/darosh/colorsort-js). 

## Install

```bash
npm i colorsort-js
```

## Usage

```javascript
import { auto } from 'colorsort-js'
import DATA from 'colorsort-js/trained.json' with { type: 'json' }

const colors = ['#000000', '#fff000', '#000fff']
const sorted = auto(colors, DATA)

console.log(sorted) // outputs sorted array ['#000fff', ...]
```

- The sorting method is selected automatically
- Some methods may require more computation time so it recommended to run this in a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- Colors must be an array of strings in this hex format `#000000`
