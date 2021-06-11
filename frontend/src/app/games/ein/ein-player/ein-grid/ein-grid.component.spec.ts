import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EinGridComponent } from './ein-grid.component';

describe('EinGridComponent', () => {
  let component: EinGridComponent;
  let fixture: ComponentFixture<EinGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EinGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EinGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
