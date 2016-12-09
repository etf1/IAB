/**
 * Parsers base class.
 */

import { parseXML } from '../xml';
import { ParserParsingError } from './ParserParsingError';
import { ParserValidationError } from './ParserValidationError';

import { ObjectSchema, validate, ValidationResult } from 'joi';

export abstract class Parser<Type> {
  /**
   * XML document (original).
   */
  protected xml: string;
  /**
   * Parsed XML document.
   */
  protected xmlObj: Object;
  /**
   * Document schema.
   */
  protected abstract schema: ObjectSchema;
  /**
   * Parsed document.
   */
  private parsedDocument: Type;
  /**
   * Document validates.
   */
  private validates: boolean = false;

  /**
   * Constructor.
   *
   * @param xml XML document (as string to be parsed or as already XML parsed object).
   */
  constructor(xml: string | Object) {
    if (!xml) {
      throw new Error('Cannot parse an empty document');
    }
    if (typeof xml === 'string') {
      this.xml = xml;
    } else {
      this.xmlObj = xml;
    }
  }
  /**
   * Parses document.
   *
   * @param doNotValidateSchema If true, just parse XML and do not validate schema.
   *
   * @throws ParserParsingError
   * @throws ParserValidationError If doNotValidateSchema is false.
   */
  public async parse(doNotValidateSchema: boolean = false): Promise<Type> {
    if (this.xmlObj && this.parsedDocument) {
      return this.parsedDocument;
    }
    try {
      if (!this.xmlObj) {
        this.xmlObj = await parseXML(this.xml);
      }
      this.parsedDocument = this.cleanUndefined(await this.parseDoc());
    } catch (err) {
      // Log
      if ((err.validationError) || (err.parsingError)) {
        throw err;
      }
      throw new ParserParsingError(err);
    }
    if (!doNotValidateSchema) {
      this.validate();
    }
    return this.parsedDocument;
  }
  /**
   * Validates document.
   *
   * @throws ParserValidationError
   */
  public validate(): void {
    if (!this.schema) {
      throw new Error('No schema defined');
    }
    if (this.isValid) {
      return;
    }
    const result: ValidationResult<Type> = validate<Type>(this.parsedDocument, this.schema);

    if (result.error) {
      // Log
      throw new ParserValidationError(result.error);
    }
    this.validates = true;
    this.parsedDocument = result.value;
  }
  /**
   * Get parsed document.
   */
  public get document(): Type {
    if (!this.parsedDocument) {
      throw new Error('Document is not parsed yet');
    }
    return this.parsedDocument;
  }
  /**
   * Whether the document has been validated.
   */
  public get isValid(): boolean {
    return this.validates;
  }

  /**
   * Parses the parsed XML xmlObj and returns the document.
   */
  protected abstract async parseDoc(): Promise<Type>;

  /**
   * Recursively remove undefined properties from document.
   *
   * @param obj Object.
   */
  /* tslint:disable: no-any */
  private cleanUndefined(obj: any): Type {
    if (typeof obj !== 'object') {
      return obj;
    }
    Object.keys(obj).forEach((key: string) => {
      if (typeof obj[key] === 'object') {
        obj[key] = this.cleanUndefined(obj[key]);
      } else if (obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
  }
  /* tslint:enable: no-any */
}
