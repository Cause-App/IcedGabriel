import { Component, OnInit } from '@angular/core';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-donation-notice',
  templateUrl: './donation-notice.component.html',
  styleUrls: ['./donation-notice.component.scss']
})
export class DonationNoticeComponent implements OnInit {

  constructor() { }

  faPaypal = faPaypal;

  ngOnInit(): void {
  }

}
