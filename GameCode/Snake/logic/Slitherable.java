package logic;

public interface Slitherable {

    enum Direction {
        LEFT,
        RIGHT,
        UP,
        DOWN
    }

  public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY);
  
}
