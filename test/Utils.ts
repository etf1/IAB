/**
 * Test utils.
 */

import * as fs from 'fs';
import * as path from 'path';

const xmlDirectory: string = path.resolve(path.join(__dirname, 'documents'));

/**
 * Get a test document.
 *
 * @param documentPath Document path relative to the test/documents/.
 */
export async function getDocument(documentPath: string): Promise<string> {
  return new Promise<string>((resolve: Function, reject: Function) => {
    if (!documentPath) { throw new Error('No document path'); }
    const xmlPath = path.join(xmlDirectory, documentPath);

    fs.readFile(xmlPath, (err: Error, data: Buffer) => {
      if (err) {
        return reject(err);
      }
      resolve(data.toString('utf-8'));
    });
  });
}
