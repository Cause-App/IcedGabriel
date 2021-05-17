import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnakeOptionsComponent } from './snake-options.component';

describe('SnakeOptionsComponent', () => {
  let component: SnakeOptionsComponent;
  let fixture: ComponentFixture<SnakeOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnakeOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnakeOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
