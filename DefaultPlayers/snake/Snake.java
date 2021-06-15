// Don't forget to add either:
// package snake1;
// package snake2;

import logic.Program;
import logic.Slitherable;
import logic.Direction;

import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;

public class Snake implements Slitherable {

	Direction lastDir = Direction.LEFT;

	public Snake() {
		Program.addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(KeyEvent e) {
				int c = e.getKeyCode();
				switch (c) {
					case KeyEvent.VK_UP:
					case KeyEvent.VK_W:
						lastDir = Direction.UP;
						break;
					case KeyEvent.VK_RIGHT:
					case KeyEvent.VK_D:
						lastDir = Direction.RIGHT;
						break;
					case KeyEvent.VK_DOWN:
					case KeyEvent.VK_S:
						lastDir = Direction.DOWN;
						break;
					case KeyEvent.VK_LEFT:
					case KeyEvent.VK_A:
						lastDir = Direction.LEFT;
						break;
				}
			}
		});
	}

	public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY) {
		return lastDir;
	}

}