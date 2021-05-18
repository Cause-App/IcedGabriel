import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnakePlayerComponent } from './snake-player.component';

describe('SnakePlayerComponent', () => {
  let component: SnakePlayerComponent;
  let fixture: ComponentFixture<SnakePlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnakePlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnakePlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
