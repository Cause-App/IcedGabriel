import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoPlayerComponent } from './uno-player.component';

describe('SnakePlayerComponent', () => {
  let component: UnoPlayerComponent;
  let fixture: ComponentFixture<UnoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
