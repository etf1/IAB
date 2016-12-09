/**
 * Parsed document does not validate schema error.
 */

import { ValidationError } from 'joi';
import { isArray, isObject, isString } from 'lodash';

export class ParserValidationError extends Error {
  /**
   * Validations error.
   */
  public validationError: ValidationError;
  /**
   * Constructor.
   *
   * @param messageOrErrors Error message or Joi ValidationError.
   * @param errors          Joi ValidationError.
   */
  constructor(messageOrErrors: string | ValidationError, error?: ValidationError) {
    let message: string;
    let validationError: ValidationError;
    /* tslint:disable: no-any */
    const isValidationError: Function = (what: any): boolean => (
      /* tslint:enable: no-any */
      isObject(what) &&
      isString(what.message) &&
      isArray(what.details)
    );

    if (!error) {
      if (!isValidationError(messageOrErrors)) {
        throw new Error('Invalid/Missing error for ParserValidationError(error: ValidationError)');
      }
      message = 'Document does not validate schema';
      validationError = <ValidationError>messageOrErrors;
    } else if (!isString(messageOrErrors) || !isValidationError(error)) {
      throw new Error('Invalid arguments for ParserValidationError(message: string; error: ValidationError)');
    } else {
      message = messageOrErrors;
      validationError = error;
    }
    super(message);
    this.validationError = validationError;
  }
}
