import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';

@Injectable()
export class SnackBarService {

  snackBarOpen = new Subject<any>();

  constructor() { }

}
