import { TestBed, inject } from '@angular/core/testing';

import { ThreadsService } from './threads.service';

describe('ThreadsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThreadsService]
    });
  });

  it('should ...', inject([ThreadsService], (service: ThreadsService) => {
    expect(service).toBeTruthy();
  }));
});

