/**
 * Test utils.
 */

import {expect} from 'chai';
import * as Joi from 'joi';

const ParserParsingError = require('../built/map/parsers/ParserParsingError').ParserParsingError;
const ParserValidationError = require('../built/map/parsers/ParserValidationError').ParserValidationError;

const validationResult: Joi.ValidationResult<number> = Joi.validate<number>(
  5,
  Joi.string(),
);

const validationError: Joi.ValidationError = validationResult.error;

const error: Error = new Error('test');

describe('IAB Errors', () => {
  describe('ParserParsingError', () => {

    it('should be instanceof Error', () => {
      const tested: Error = new ParserParsingError(error);

      expect(tested).to.be.instanceof(Error);
    });

    it('should accept valid arguments', () => {
      const argsList: any[] = [
        [error],
        ['test message', error],
      ];

      argsList.forEach((args: any[]) => {
        expect(
          () => new ParserParsingError(...args),
        ).to.not.throw();
      });
    });

    it('should not accept INvalid arguments', () => {
      const argsList: any[] = [
        ['something'],
        [error, 'test'],
        ['test', {}],
      ];

      argsList.forEach((args: any[]) => {
        expect(
          () => new ParserParsingError(...args),
        ).to.throw();
      });
    });

    it('should give the valid message', () => {
      const tests: any[] = [
        [
          [error],
          'Document could not be parsed',
        ],
        [
          ['test message', error],
          'test message',
        ],
      ];

      tests.forEach((expectations: any[]) => {
        const errorInstance: any = new ParserParsingError(...expectations[0]);

        expect(errorInstance.message).to.be.equal(expectations[1]);
        expect(errorInstance.parsingError).to.be.equal(error);
      });
    });
  });

  describe('ParserValidationError', () => {

    it('should be instanceof Error', () => {
      const tested: Error = new ParserValidationError(validationError);

      expect(tested).to.be.instanceof(Error);
    });

    it('should accept valid arguments', () => {
      const argsList: any[] = [
        [validationError],
        ['test message', validationError],
      ];

      argsList.forEach((args: any[]) => {
        expect(
          () => new ParserValidationError(...args),
        ).to.not.throw();
      });
    });

    it('should not accept INvalid arguments', () => {
      const argsList: any[] = [
        ['something'],
        [validationError, 'test'],
        ['test', {}],
      ];

      argsList.forEach((args: any[]) => {
        expect(
          () => new ParserValidationError(...args),
        ).to.throw();
      });
    });

    it('should give the valid message', () => {
      const tests: any[] = [
        [
          [validationError],
          'Document does not validate schema',
        ],
        [
          ['test message', validationError],
          'test message',
        ],
      ];

      tests.forEach((expectations: any[]) => {
        const errorInstance: any = new ParserValidationError(...expectations[0]);

        expect(errorInstance.message).to.be.equal(expectations[1]);
        expect(errorInstance.validationError).to.be.equal(validationError);
      });
    });
  });
});
