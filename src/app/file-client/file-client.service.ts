import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';


import { Observable} from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

/* Naming NOTE
  The API's file field is `fileItem` thus, we name it the same below
  it's like saying <input type='file' name='fileItem' /> 
  on a standard file field
*/


@Injectable()
export class FileClientService {

  apiBaseURL = this.globalsService.baseUrl + environment.ajax_dir + '/ajax-ng-post-file-module.cfm';
  debug: boolean = false;

  constructor(private http: HttpClient,
              public globalsService: GlobalsService) { 

  }

  fileUpload(fileItem:File,extraData?:object):any{
    const apiCreateEndpoint = `${this.apiBaseURL}`;
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    const formData: FormData = new FormData();
    formData.append('fileItem', fileItem, fileItem.name);
    if (extraData) {
      for(const key in extraData) {
        if (extraData.hasOwnProperty(key)) {
          formData.append(key, extraData[key]);
        }
      }
    }
    if(this.debug) {
      console.log('formData: ',formData.get('fileItem'));
    }
    const req = new HttpRequest('POST', apiCreateEndpoint, formData, {
      headers: headers,
      reportProgress: true
    });
    return this.http.request(req);
  }

  optionalFileUpload(fileItem?: File,extraData?: object):any{
      const apiCreateEndpoint = `${this.apiBaseURL}`;
      const formData: FormData = new FormData();
      let fileName;
      if (extraData) {
        for(const key in extraData) {
          if (extraData.hasOwnProperty(key)) {
            // iterate and set other form data
            if (key === 'fileName') {
              fileName = extraData[key];
            }
            formData.append(key, extraData[key]);
          }
        }
      }
      if (fileItem) {
        if (!fileName) {
           fileName = fileItem.name;
        }
        formData.append('image', fileItem, fileName);
      }
      const req = new HttpRequest('POST', apiCreateEndpoint, formData, {
        reportProgress: true // for progress data
      });
      return this.http.request(req);
  }
    list(): Observable<any>{
      const listEndpoint = `${this.apiBaseURL}`;
      return this.http.get(listEndpoint);
    }

}
