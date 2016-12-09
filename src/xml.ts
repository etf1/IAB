/**
 * XML Parser shorthand.
 */

import * as xml2json from 'xml2json';

/**
 * Parses a XML document and eventually validates it against a XSD.
 *
 * @param xml XML document (as string).
 */
export async function parseXML(xml: string): Promise<Object> {
  return new Promise<Object>((resolve: Function, reject: Function): void => {
    let doc: Object;

    try {
      doc = xml2json.toJson(
        xml,
        {
          object: true,
          reversible: true,
          sanitize: false,
          trim: true,
          arrayNotation: true,
        }
      );
    } catch (err) {
      return reject(Error(`Invalid XML document : ${err.message || err}`));
    }
    resolve(doc);
  });
}
