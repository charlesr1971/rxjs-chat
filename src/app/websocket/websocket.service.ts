import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import * as Rx from 'rxjs/Rx';

import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

@Injectable()
export class WebsocketService {

  debug: boolean = false;
  // Our socket connection
  private socket;

  constructor(public globalsService: GlobalsService) { 

  }

  connect(): Rx.Subject<MessageEvent> {
    // If you aren't familiar with environment variables then
    // you can hard code `environment.ws_url` as `http://localhost:5000`
    this.socket = io(this.globalsService.wsUrl);
    if(this.debug) {
      console.log('WEBSOCKET.SERVICE: ',this.globalsService.wsUrl);
    }

    // We define our observable which will observe any incoming messages
    // from our socket.io server.
    const observable = new Observable(observer => {
        this.socket.on('message', (data) => {
          if(this.debug) {
            console.log('Received message from Websocket Server');
          }
          observer.next(data);
        });
        return () => {
          this.socket.disconnect();
        };
    });

    const getCircularReplacer = () => {
      const seen = new WeakSet;
      return (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };
    
    // We define our Observer which will listen to messages
    // from our other components and send messages back to our
    // socket server whenever the `next()` method is called.
    const observer = {
        next: (data: Object) => {
            if(this.debug) {
              console.log('Next message sent to Websocket Server');
            }
            this.socket.emit('message', JSON.stringify(data,getCircularReplacer()));
        },
    };

    // we return our Rx.Subject which is a combination
    // of both an observer and observable.
    return Rx.Subject.create(observer, observable);
  }

}

