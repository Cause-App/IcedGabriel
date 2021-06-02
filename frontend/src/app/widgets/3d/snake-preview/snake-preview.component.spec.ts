import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnakePreviewComponent } from './snake-preview.component';

describe('SnakePreviewComponent', () => {
  let component: SnakePreviewComponent;
  let fixture: ComponentFixture<SnakePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnakePreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnakePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
