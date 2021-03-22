import { uuid } from '../util/uuid';

/**
 * A File represents an optional file sent with a message
 */

export class File {

  // id: string;

  constructor(public clientfilename: string,
              public filename: string,
              public filetype: string,
              public binaryFiletype: string,
              public filesize: string,
              public value: string,
              public id?: string) {

    this.id = id || uuid();

  }
  
}
