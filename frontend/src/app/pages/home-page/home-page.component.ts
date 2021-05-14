import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(private http: HttpClient) { }

  code = `public class Snake implements Slitherable {

  @Override
  public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY) {
    return Direction.LEFT;
  }

  @Override
  public String getName() {
    return "My Awesome Snake";
  }

}
  `;

  submit(): void {
    this.http.get(`/api/submitsnake?code=${encodeURIComponent(this.code)}`).toPromise();
  }

}
