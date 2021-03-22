import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatLoaderComponent } from './chat-loader.component';

describe('ChatLoaderComponent', () => {
  let component: ChatLoaderComponent;
  let fixture: ComponentFixture<ChatLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
