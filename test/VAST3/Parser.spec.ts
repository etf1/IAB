/**
 * VAST3 Parser tests.
 */

require('source-map-support').install();

import { getDocument } from '../Utils';

import * as Bluebird from 'bluebird';
import * as Chai from 'chai';
import * as ChaiAsPromised  from 'chai-as-promised';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { inspect } from 'util';

Chai.use(ChaiAsPromised);

const VAST3Parser = require('../../built/map/parsers/VAST3').VAST3Parser;
const ParserParsingError = require('../../built/map/parsers/ParserParsingError').ParserParsingError;
const ParserValidationError = require('../../built/map/parsers/ParserValidationError').ParserValidationError;

describe('VAST3 Parser', () => {
  it('Should respect the Parser interface', async function(): Promise<any> {
    Chai.expect(VAST3Parser).to.be.a('function');

    const parser = new VAST3Parser(await getDocument('VAST3/valid/empty.xml'));
    Chai.expect(parser.parse).to.be.a('function');
    Chai.expect(parser.validate).to.be.a('function');
    const parsePromise: Promise<any> = parser.parse(true);
    Chai.expect(parsePromise).to.have.property('then');
    Chai.expect(parsePromise.then).to.be.a('function');

    const result:any = await parsePromise;
    Chai.expect(result).to.be.an('object');
    Chai.expect(parser.document).to.be.an('object');
    Chai.expect(parser.isValid).to.be.false;
    parser.validate();
    Chai.expect(parser.isValid).to.be.true;
  });

  it('Should parse and validate valid documents', async function(): Promise<any> {
    const dir: string = path.join(__dirname, '..', 'documents', 'VAST3', 'valid');
    const files: string[] = (await Bluebird.promisify(fs.readdir)(dir)).filter(file => (path.extname(file) === '.xml'));

    return Bluebird.all(
      files.map(async function(file: string): Promise<any> {
        const parser = new VAST3Parser(await getDocument(`VAST3/valid/${file}`));
        let expected: string;

        try {
          expected = await getDocument(`VAST3/valid/${path.basename(file, '.xml')}.expected`);
        } catch(err) {
          expected = null;
        }

          return parser.parse(true)
            .catch((err: Error) => {
              let add: string = '';

              if (err instanceof ParserParsingError) {
                add = `:\n${(<any>err).parsingError}`;
              }
              throw new Error(`VAST3/valid/${file} should have been parsed correctly, returned ${err}${add}`);
            })
            .then(() => parser.validate())
            .catch((err: any) => {
              let details: string = err.message;

              if (_.isObject(err.validationError) && _.isObject(err.validationError.details)) {
                details = inspect(err.validationError.details);
              }
              throw new Error(`VAST3/valid/${file} should validate against schema, thrown a ${err.constructor.name}\n${details}`);
            })
            .then(() => {
              if (expected) {
                const expectedDoc: Object = JSON.parse(expected);

                return Chai.expect(parser.document).to.deep.equal(expectedDoc);
              } else {
                console.log(JSON.stringify(parser.document));
              }
            });
      })
    );
  });

  it('Should not parse invalid documents', async function(): Promise<any> {
    const dir: string = path.join(__dirname, '..', 'documents', 'VAST3', 'invalid', 'parsing');
    const files: string[] = await Bluebird.promisify(fs.readdir)(dir);

    return Bluebird.all(
      files.map(async function(file: string): Promise<any> {
        const parser = new VAST3Parser(await getDocument(`VAST3/invalid/parsing/${file}`));

        return parser.parse(true)
          .catch((err: Error) => {
            if ((<any>err).parsingError) {
              return 'ok, rejected';
            }
            throw err;
          })
          .then((value: any) => {
            if (value !== 'ok, rejected') {
              throw new Error(`Parsing VAST3/invalid/parsing/${file} should throw an Error`);
            }
          });
      })
    );
  });

  it('Should not validate XML valid documents that does not satisfy schema', async function(): Promise<any> {
    const dir: string = path.join(__dirname, '..', 'documents', 'VAST3', 'invalid', 'validation');
    const files: string[] = await Bluebird.promisify(fs.readdir)(dir);

    return Bluebird.all(
      files.map(async function(file: string): Promise<any> {
        const parser = new VAST3Parser(await getDocument(`VAST3/invalid/validation/${file}`));

          return parser.parse(true)
            .catch((err: Error) => {
              throw new Error(`VAST3/invalid/validation/${file} should have been XML parsed correctly, returned ${err}`);
            })
            .then(() => parser.validate())
            .catch((err: any) => {
              if ((<any>err).validationError) {
                return 'ok, rejected';
              }
              throw err;
            })
            .then((value: any) => {
              if (value !== 'ok, rejected') {
                throw new Error(`Validating VAST3/invalid/validation/${file} should throw an Error`);
              }
            });
      })
    );
  });
});
