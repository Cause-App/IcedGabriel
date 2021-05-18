import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnakeGridComponent } from './snake-grid.component';

describe('SnakeGridComponent', () => {
  let component: SnakeGridComponent;
  let fixture: ComponentFixture<SnakeGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnakeGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnakeGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
