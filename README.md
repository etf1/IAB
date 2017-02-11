# IAB's Vast & VMAP formats handling for Node.js.

[![dependencies Status](https://david-dm.org/etf1/IAB/status.svg)](https://david-dm.org/etf1/IAB) [![Build Status](https://travis-ci.org/etf1/IAB.svg?branch=master)](https://travis-ci.org/etf1/IAB) [![codecov](https://codecov.io/gh/etf1/IAB/branch/master/graph/badge.svg)](https://codecov.io/gh/etf1/IAB) [![Known Vulnerabilities](https://snyk.io/test/github/etf1/IAB/badge.svg)](https://snyk.io/test/github/etf1/IAB)

```js
const IAB = require('iab');

// VAST 2/3
const parser = new IAB.VASTParser(vastXMLContent);
// Or VMAP
const parser = new IAB.VMAPParser(vastXMLContent);

parser.parse()
    .then((document) => {
      // document is now a VAST/VMAP parsed document object.
      // Eg : document.ads[1].adTitle => 'Ad's title'
    })
    .catch((err) => {
      if (err.parsingError) {
        console.err(`Could not parse document : ${err}`);
      } else if (err.parsingError) {
        console.err(`Could not validate document : ${err}`);
      }
    });
```

## Parsed document objects

The parsed document objects definition can be found here :

- [VAST3](https://github.com/etf1/IAB/blob/master/src/definitions/VAST3.ts)
- [VMAP](https://github.com/etf1/IAB/blob/master/src/definitions/VMAP.ts)

The TypeScript source is fully documented and should be easy to read for JS developers.

## Compatibility

As this module is using Joi for validation, the minimum Node.js version required is 4.

## @TODO
- Correctly handle XMLNS
- Handle icons
- Handle nonlinear & companion creative
