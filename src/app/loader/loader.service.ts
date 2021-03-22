import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

import { LoaderState } from '../loader/loader';

@Injectable()

export class LoaderService {

  loaderSubject: BehaviorSubject<LoaderState> = new BehaviorSubject<LoaderState>(null);
  loaderState = this.loaderSubject.asObservable();
  loaderSize = new Subject<any>();

  constructor() { 

  }

  show() {
    this.loaderSubject.next(<LoaderState>{show: true});
  }

  hide() {
    this.loaderSubject.next(<LoaderState>{show: false});
  }

}
