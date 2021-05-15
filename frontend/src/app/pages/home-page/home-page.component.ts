import { Component } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(private api: ApiService) { }

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

  async submit(): Promise<void> {
    const response = await this.api.get("submitsnake", {code: this.code});
    console.log(response);
  }

}
