import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoGridComponent } from './uno-grid.component';

describe('SnakeGridComponent', () => {
  let component: UnoGridComponent;
  let fixture: ComponentFixture<UnoGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnoGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
