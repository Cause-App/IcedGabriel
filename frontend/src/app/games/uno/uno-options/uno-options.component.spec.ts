import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoOptionsComponent } from './uno-options.component';

describe('SnakeOptionsComponent', () => {
  let component: UnoOptionsComponent;
  let fixture: ComponentFixture<UnoOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnoOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
