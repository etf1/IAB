/**
 * Parsing document error.
 */

import { isError, isString } from 'lodash';

export class ParserParsingError extends Error {
  /**
   * Parsing error.
   */
  public parsingError: Error;
  /**
   * Constructor.
   *
   * @param messageOrError Error message or Error.
   * @param error          Parsing error.
   */
  constructor(messageOrError: string | Error, error?: Error) {
    let message: string;
    let parsingError: Error;

    if (!error) {
      if (!isError(messageOrError)) {
        throw new Error('Invalid/Missing error for ParserParsingError(error: Error)');
      }
      message = 'Document could not be parsed';
      parsingError = <Error>messageOrError;
    } else if (!isString(messageOrError) || !isError(error)) {
      throw new Error('Invalid arguments for ParserParsingError(message: string; error: Error)');
    } else {
      message = messageOrError;
      parsingError = error;
    }
    super(message);
    this.parsingError = parsingError;
  }
}
