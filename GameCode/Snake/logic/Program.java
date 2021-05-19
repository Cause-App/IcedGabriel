package logic;

import java.util.Queue;
import java.util.Random;
import java.util.concurrent.*;

import logic.Slitherable.Direction;

public class Program {

	private static int GRID_WIDTH;
	private static int GRID_HEIGHT;
	private static int SNAKE_MOVE_MAX_MILLIS;
	private static int MAX_ROUNDS;

	private static class SnakeThread implements Runnable {
		private final Game game;
		private final Slitherable snake;
		private final boolean s1;

		public SnakeThread(Game game, Slitherable snake, boolean s1) {
			this.game = game;
			this.snake = snake;
			this.s1 = s1;
		}

		@Override
		public void run() {
			int myX, myY, enemyX, enemyY;
			if (s1) {
				myX = game.s1x;
				myY = game.s1y;
				enemyX = game.s2x;
				enemyY = game.s2y;
			} else {
				myX = game.s2x;
				myY = game.s2y;
				enemyX = game.s1x;
				enemyY = game.s1y;
			}
			Direction d = snake.move(myX, myY, enemyX, enemyY, game.ax, game.ay);
			if (s1) {
				game.s1Move = d;
			} else {
				game.s2Move = d;
			}
		}
	}

	private static class Game {
		private final Grid grid;
		private int s1x;
		private int s1y;
		private int s2x;
		private int s2y;
		private int ax;
		private int ay;
		private final Queue<int[]> s1Trail = new LinkedBlockingQueue<>();
		private final Queue<int[]> s2Trail = new LinkedBlockingQueue<>();
		private final Random rng = new Random();

		public Direction s1Move;
		public Direction s2Move;

		public void newRound() {
			s1Move = null;
			s2Move = null;
		}

		private void putApple() {
			do {
				ax = rng.nextInt(GRID_WIDTH);
				ay = rng.nextInt(GRID_HEIGHT);
			} while (grid.get(ax, ay) != Grid.Tile.EMPTY);
			grid.set(ax, ay, Grid.Tile.APPLE);
		}

		public Game() {
			grid = new Grid(GRID_WIDTH, GRID_HEIGHT);

			s1x = rng.nextInt(GRID_WIDTH / 2);
			s1y = rng.nextInt(GRID_HEIGHT);
			s2x = rng.nextInt(GRID_WIDTH / 2);
			s2y = rng.nextInt(GRID_HEIGHT);

			if (rng.nextBoolean()) {
				s1x += GRID_WIDTH / 2;
			} else {
				s2x += GRID_WIDTH / 2;
			}

			s1Trail.add(new int[]{s1x, s1y});
			s2Trail.add(new int[]{s2x, s2y});

			grid.set(s1x, s1y, Grid.Tile.SNAKE1);
			grid.set(s2x, s2y, Grid.Tile.SNAKE2);
			putApple();

		}

		public void setS1Pos(int s1x, int s1y) {
			this.s1x = s1x;
			this.s1y = s1y;
			s1Trail.add(new int[]{s1x, s1y});
			this.grid.set(s1x, s1y, Grid.Tile.SNAKE1);
		}

		public void setS2Pos(int s2x, int s2y) {
			this.s2x = s2x;
			this.s2y = s2y;
			s2Trail.add(new int[]{s2x, s2y});
			this.grid.set(s2x, s2y, Grid.Tile.SNAKE2);
		}

		public void removeS1Tail() {
			int[] t = s1Trail.poll();
			grid.set(t[0], t[1], Grid.Tile.EMPTY);
		}

		public void removeS2Tail() {
			int[] t = s2Trail.poll();
			grid.set(t[0], t[1], Grid.Tile.EMPTY);
		}

		public String toString() {
			return grid.toString();
		}

	}

	private static class Grid {

		enum Tile {
			EMPTY, SNAKE1, SNAKE2, APPLE
		}

		private final Tile[][] cells;

		public Grid(int width, int height) {
			cells = new Tile[height][width];
			for (int y = 0; y < height; y++) {
				for (int x = 0; x < width; x++) {
					cells[y][x] = Tile.EMPTY;
				}
			}
		}

		public void set(int x, int y, Tile tile) {
			this.cells[y][x] = tile;
		}

		public Tile get(int x, int y) {
			return this.cells[y][x];
		}

		public String toString() {
			String s = "";
			for (int i = 0; i < GRID_WIDTH + 2; i++) {
				s += "-";
			}
			s += "\n";
			for (int y = 0; y < GRID_HEIGHT; y++) {
				s += "|";
				for (int x = 0; x < GRID_WIDTH; x++) {
					Tile t = get(x, y);
					switch (t) {
						case EMPTY:
							s += " ";
							break;
						case SNAKE1:
							s += "1";
							break;
						case SNAKE2:
							s += "2";
							break;
						case APPLE:
							s += "A";
							break;
					}
				}
				s += "|\n";
			}
			for (int i = 0; i < GRID_WIDTH + 2; i++) {
				s += "-";
			}
			return s;
		}

	}

	private static int dirToInt(Direction e) {
		if (e == null) {
			return -1;
		}
		if (e == Direction.UP) {
			return 0;
		}
		if (e == Direction.RIGHT) {
			return 1;
		}
		if (e == Direction.DOWN) {
			return 2;
		}
		return 3;
	}

	private static Game game;

	public static void main(String[] args) {
		if (args.length < 4) {
			System.err.println("Expected 4 arguments but only received "+args.length);
			System.exit(1);
		}

		GRID_WIDTH = Integer.parseInt(args[0]);
		GRID_HEIGHT = Integer.parseInt(args[1]);
		SNAKE_MOVE_MAX_MILLIS = Integer.parseInt(args[2]);
		MAX_ROUNDS = Integer.parseInt(args[3]);

		String log = ""+GRID_WIDTH+","+GRID_HEIGHT;
		game = new Game();

		ExecutorService executor = Executors.newSingleThreadExecutor();

		SnakeThread s1 = new SnakeThread(game, new snake1.Snake(), true);
		SnakeThread s2 = new SnakeThread(game, new snake2.Snake(), false);

		log += ","+game.s1x+","+game.s1y+","+game.s2x+","+game.s2y+","+game.ax+","+game.ay;

		boolean over;
		int rounds = 0;
		try {
			do {
				over = true;
				game.newRound();
				Future f1 = executor.submit(s1);
				try {
					f1.get(SNAKE_MOVE_MAX_MILLIS, TimeUnit.MILLISECONDS);
				} catch (TimeoutException | InterruptedException | ExecutionException e) {
					f1.cancel(true);
				}
				Future f2 = executor.submit(s2);
				try {
					f2.get(SNAKE_MOVE_MAX_MILLIS, TimeUnit.MILLISECONDS);
				} catch (TimeoutException | InterruptedException | ExecutionException e) {
					f2.cancel(true);
				}

				log+=","+dirToInt(game.s1Move)+","+dirToInt(game.s2Move);

				if (game.s1Move == null && game.s2Move == null) {
					log += ",0";
				} else if (game.s1Move == null) {
					log += ",2";
				} else if (game.s2Move == null) {
					log += ",1";
				} else {
					int ns1x = game.s1x + GRID_WIDTH;
					int ns1y = game.s1y + GRID_HEIGHT;
					Direction d1 = game.s1Move;
					if (d1 == Direction.UP) {
						ns1y--;
					} else if (d1 == Direction.RIGHT) {
						ns1x++;
					} else if (d1 == Direction.DOWN) {
						ns1y++;
					} else if (d1 == Direction.LEFT) {
						ns1x--;
					}

					int ns2x = game.s2x + GRID_WIDTH;
					int ns2y = game.s2y + GRID_HEIGHT;
					Direction d2 = game.s2Move;
					if (d2 == Direction.UP) {
						ns2y--;
					} else if (d2 == Direction.RIGHT) {
						ns2x++;
					} else if (d2 == Direction.DOWN) {
						ns2y++;
					} else if (d2 == Direction.LEFT) {
						ns2x--;
					}

					ns1x %= GRID_WIDTH;
					ns1y %= GRID_HEIGHT;
					ns2x %= GRID_WIDTH;
					ns2y %= GRID_HEIGHT;

					boolean s1Died = false;
					boolean s2Died = false;
					boolean gotApple = false;

					if (ns1x == ns2x && ns1y == ns2y) {
						s1Died = true;
						s2Died = true;
						log += ",0";
					} else {
						Grid.Tile t1 = game.grid.get(ns1x, ns1y);
						Grid.Tile t2 = game.grid.get(ns2x, ns2y);
						if (t1 != Grid.Tile.APPLE) {
							game.removeS1Tail();
						} else {
							gotApple = true;
						}
						if (t2 != Grid.Tile.APPLE) {
							game.removeS2Tail();
						} else {
							gotApple = true;
						}
						if (t1 == Grid.Tile.SNAKE1 || t1 == Grid.Tile.SNAKE2) {
							s1Died = true;
						}
						if (t2 == Grid.Tile.SNAKE1 || t2 == Grid.Tile.SNAKE2) {
							s2Died = true;
						}
						game.setS1Pos(ns1x, ns1y);
						game.setS2Pos(ns2x, ns2y);
						if (gotApple) {
							game.putApple();
							log += ","+game.ax+","+game.ay;
						} else {
							log += ",-1,-1";
						}
					}

					if (s1Died && !s2Died) {
						log += ",2";
					} else if (!s1Died && s2Died) {
						log += ",1";
					} else if (s1Died && s2Died) {
						log += ",0";
					} else {
						over = false;
					}
				}
			} while (!over & ++rounds < MAX_ROUNDS);

			if (!over) {
				log += ",-1,-1,0";
			}

			System.out.print(log);
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			System.exit(0);
		}

	}

}