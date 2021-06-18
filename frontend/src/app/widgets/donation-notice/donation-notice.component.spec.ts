import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonationNoticeComponent } from './donation-notice.component';

describe('DonationNoticeComponent', () => {
  let component: DonationNoticeComponent;
  let fixture: ComponentFixture<DonationNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DonationNoticeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DonationNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
