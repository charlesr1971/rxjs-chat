import { uuid } from '../util/uuid';

/**
 * A User represents an agent that sends messages
 */

export class User {

  // id: string;

  constructor(public name: string,
              public avatarSrc: string,
              public contactid: number,
              public adminid: number,
              public adminsessionid: string,
              public isAdmin: boolean,
              public id?: string) {

    this.id = id || uuid();

  }
  
}
