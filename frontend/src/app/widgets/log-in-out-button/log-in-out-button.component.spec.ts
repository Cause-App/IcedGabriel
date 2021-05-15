import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogInOutButtonComponent } from './log-in-out-button.component';

describe('LogInOutButtonComponent', () => {
  let component: LogInOutButtonComponent;
  let fixture: ComponentFixture<LogInOutButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogInOutButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogInOutButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
