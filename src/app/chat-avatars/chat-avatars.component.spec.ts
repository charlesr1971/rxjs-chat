import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatAvatarsComponent } from './chat-avatars.component';

describe('ChatAvatarsComponent', () => {
  let component: ChatAvatarsComponent;
  let fixture: ComponentFixture<ChatAvatarsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatAvatarsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatAvatarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
