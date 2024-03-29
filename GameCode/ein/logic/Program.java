package logic;

import java.awt.event.MouseAdapter;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class Program {

	private static int MOVE_MAX_MILLIS;

	private static class OutOfCardsException extends RuntimeException {
	}

	;

	private static class PlayerThread implements Runnable {
		private final Game game;
		private final EinPlayerInterface player;
		private final boolean s1;

		public PlayerThread(Game game, EinPlayerInterface player, boolean s1) {
			this.game = game;
			this.player = player;
			this.s1 = s1;
		}

		@Override
		public void run() {
			PrintStream stdout = System.out;
			PrintStream stderr = System.err;

			ByteArrayOutputStream baos = new ByteArrayOutputStream();

			try (PrintStream ps = new PrintStream(baos)) {
				if (!Program.graphical) {
					System.setOut(ps);
					System.setErr(ps);
				}
				List<Card> hand;
				List<Card> otherHand;
				if (s1) {
					hand = game.s1Hand;
					otherHand = game.s2Hand;
				} else {
					hand = game.s2Hand;
					otherHand = game.s1Hand;
				}
				Card d = player.playCard(game.lastPlayedCard, hand.toArray(new Card[hand.size()]), otherHand.size());
				game.move = d;
			} catch (Exception e) {
				throw e;
			} finally {
				System.setOut(stdout);
				System.setErr(stderr);
				if (s1 && !Program.graphical) {
					game.s1Out = baos.toString();
				}
			}
		}
	}

	static class Game {
		private static final int CARDS_PER_HAND = 7;

		final LinkedList<Card> deck;
		final List<Card> s1Hand;
		final List<Card> s2Hand;

		Card lastPlayedCard;
		private List<Card> played;
		boolean s1Turn;

		public Card move;
		private int mustPickUp2;
		private int mustPickUp4;
		private boolean canPickColor;
		public String s1Out;

		public void newRound() {
			move = null;
			s1Out = "";
		}

		private Card deal() {
			if (deck.size() == 0) {
				if (played.size() == 0) {
					throw new OutOfCardsException();
				}
				deck.addAll(played);
				Collections.shuffle(deck);
				played = new ArrayList<>();
			}
			return deck.removeFirst();
		}

		public Game() {
			deck = new LinkedList<>();
			for (Card.Suit s : new Card.Suit[]{Card.Suit.RED, Card.Suit.GREEN, Card.Suit.YELLOW, Card.Suit.BLUE}) {
				deck.add(new Card(Card.Value.ZERO, s));
				for (Card.Value v : new Card.Value[]{Card.Value.ONE, Card.Value.TWO, Card.Value.THREE, Card.Value.FOUR, Card.Value.FIVE, Card.Value.SIX, Card.Value.SEVEN, Card.Value.EIGHT, Card.Value.NINE, Card.Value.DRAW2, Card.Value.SKIP, Card.Value.REVERSE}) {
					deck.add(new Card(v, s));
					deck.add(new Card(v, s));
				}
			}
			for (Card.Value v : new Card.Value[]{Card.Value.DRAW4, Card.Value.CHANGECOLOR}) {
				for (int i = 0; i < 4; i++) {
					deck.add(new Card(v, Card.Suit.WILD));
				}
			}
			Collections.shuffle(deck);

			s1Hand = new ArrayList<>();
			s2Hand = new ArrayList<>();
			s1Turn = new Random().nextBoolean();
			List<Card> h1 = s1Turn ? s2Hand : s1Hand;
			List<Card> h2 = s1Turn ? s1Hand : s2Hand;
			for (int i = 0; i < CARDS_PER_HAND; i++) {
				h1.add(deal());
				h2.add(deal());
			}

			lastPlayedCard = deal();
			mustPickUp2 = 0;
			mustPickUp4 = 0;
			canPickColor = false;
			played = new ArrayList<>();
		}

		public boolean moveValid() {
			return moveValid(move);
		}

		public boolean moveValid(Card move) {
			if (move == null) {
				return false;
			}

			if (lastPlayedCard == null) {
				return true;
			}

			List<Card> hand = s1Turn ? s1Hand : s2Hand;
			if (!hand.contains(move)) {
				return false;
			}

			if (mustPickUp2 > 0) {
				return move.value == Card.Value.DRAW2;
			}
			if (mustPickUp4 > 0) {
				return move.value == Card.Value.DRAW4;
			}

			if (move.suit == lastPlayedCard.suit || move.value == lastPlayedCard.value || move.suit == Card.Suit.WILD) {
				return true;
			}

			return canPickColor;
		}

		public Card pickUpIfCantMove() {
			List<Card> hand = s1Turn ? s1Hand : s2Hand;
			boolean hasOptions = false;
			for (Card c : hand) {
				if (moveValid(c)) {
					hasOptions = true;
					break;
				}
			}
			if (!hasOptions) {
				Card c = deal();
				hand.add(c);
				if (!moveValid(c)) {
					s1Turn = !s1Turn;
				}
				return c;
			}
			return null;

		}

		public List<Card> makeMove() {
			played.add(lastPlayedCard);
			lastPlayedCard = move;
			List<Card> hand = s1Turn ? s1Hand : s2Hand;
			List<Card> otherHand = s1Turn ? s2Hand : s1Hand;
			List<Card> drawn = new ArrayList<>();
			hand.remove(move);

			canPickColor = false;

			if (move.value == Card.Value.DRAW2) {
				mustPickUp2 += 1;
				boolean canBeCountered = false;
				for (Card x : otherHand) {
					if (x.value == Card.Value.DRAW2) {
						canBeCountered = true;
						break;
					}
				}
				if (canBeCountered) {
					s1Turn = !s1Turn;
				} else {
					for (int i = 0; i < mustPickUp2 * 2; i++) {
						Card c = deal();
						otherHand.add(c);
						drawn.add(c);
					}
					mustPickUp2 = 0;
				}
			} else if (move.value == Card.Value.DRAW4) {
				mustPickUp4 += 1;
				boolean canBeCountered = false;
				for (Card x : otherHand) {
					if (x.value == Card.Value.DRAW4) {
						canBeCountered = true;
						break;
					}
				}
				if (canBeCountered) {
					s1Turn = !s1Turn;
				} else {
					for (int i = 0; i < mustPickUp4 * 4; i++) {
						Card c = deal();
						otherHand.add(c);
						drawn.add(c);
					}
					mustPickUp4 = 0;
					canPickColor = true;
				}
			} else if (move.value == Card.Value.CHANGECOLOR) {
				canPickColor = true;
			} else if (move.value != Card.Value.SKIP && move.value != Card.Value.REVERSE) {
				s1Turn = !s1Turn;
			}
			return drawn;
		}
	}

	private static Window window;

	public static void addMouseListener(MouseAdapter ma) {
		if (window != null) {
			window.addMouseListener(ma);
		}
	}

	public static int getClickedCardIndex(boolean player1, int x, int y) {
		if (window != null) {
			return window.getClickedCardIndex(player1, x, y);
		}
		return -1;
	}

	private static String encode(String x) {
		return x.replace("\r", "").replace("&", "&amp;").replace("\n", "&newline;").replace(":", "&colon;");
	}

	private static Game game;

	public static boolean isCardValid(Card c) {
		return game.moveValid(c);
	}

	static boolean graphical;
	static boolean lock = false;

	public static void main(String[] args) {
		if (args.length < 3) {
			System.err.println("Expected 3 arguments but only received " + args.length);
			System.exit(1);
		}

		MOVE_MAX_MILLIS = Integer.parseInt(args[0]);
		float fps = Float.parseFloat(args[1]);
		graphical = fps > 0;
		int numberOfGames = Integer.parseInt(args[2]);
		boolean ranked = numberOfGames >= 0;
		if (!ranked) {
			numberOfGames = 1;
		}


		String log = "";

		window = null;

		if (graphical) {
			window = Window.newWindow(Math.round(1000 / fps));
		}

		ExecutorService executor = Executors.newSingleThreadExecutor();


		String s1Out = "";

		boolean over;
		int rounds = 0;
		try {
			int wins = 0;
			int loses = 0;
			int draws = 0;
			for (int gameNum = 0; gameNum < numberOfGames; gameNum++) {

				if (window != null) {
					lock = true;
					window.repaint();

				}

				while (lock) {
					Thread.sleep(1);
				}


				game = new Game();

				if (window != null) {
					window.setGame(game);
					window.repaint();
				}

				PlayerThread s1 = new PlayerThread(game, new einplayer1.EinPlayer(), true);
				PlayerThread s2 = new PlayerThread(game, new einplayer2.EinPlayer(), false);


				log += game.deck.size() + "," + game.s1Hand.size() + "," + game.s2Hand.size();

				for (Card c : game.s1Hand) {
					log += "," + c;
				}

				log += "," + game.lastPlayedCard;
				log += game.s1Turn ? ",1" : ",2";

				Card p;
				do {
					boolean s1Turn = game.s1Turn;
					p = game.pickUpIfCantMove();

					if (window != null) {
						if (p != null) {
							window.animate(p, s1Turn, true);
						}
						while (window.animating != null) {
							Thread.sleep(1);
							window.repaint();
						}
					}
					if (p != null) {
						if (s1Turn) {
							log += "," + p;
						} else {
							log += ",1";
						}
					}

				} while (p != null);

				log += ",0";

				do {
					game.newRound();
					over = true;
					Future future = executor.submit(game.s1Turn ? s1 : s2);
					try {
						future.get(MOVE_MAX_MILLIS, TimeUnit.MILLISECONDS);
					} catch (TimeoutException | InterruptedException | ExecutionException e) {
						if (graphical) {
							e.printStackTrace();
						} else if (game.s1Turn) {
							StringWriter sw = new StringWriter();
							PrintWriter pw = new PrintWriter(sw);
							e.printStackTrace(pw);
							game.s1Out += sw.toString();
						}
						future.cancel(true);
					}

					if (!graphical && game.s1Out.length() > 0) {
						s1Out += "" + rounds + ":" + encode(game.s1Out) + "\n";
					}


					log += "," + game.move;

					if (!game.moveValid()) {
						if (game.s1Turn) {
							log += ",0," + game.deck.size() + ",0,2";
							loses++;
						} else {
							log += ",0," + game.deck.size() + ",0,1";
							wins++;
						}
					} else {
						try {
							boolean s1TurnAtStart = game.s1Turn;
							List<Card> drawn = game.makeMove();
							if (window != null) {
								window.animate(game.move, s1TurnAtStart, false, drawn.size());
								while (window.animating != null) {
									Thread.sleep(1);
									window.repaint();
								}
							}

							if (game.s1Hand.size() == 0) {
								log += ",0," + game.deck.size() + ",0,1";
								wins++;
							} else if (game.s2Hand.size() == 0) {
								log += ",0," + game.deck.size() + ",0,2";
								loses++;
							} else {
								Card q;
								int hideCount = drawn.size();
								if (s1TurnAtStart) {
									for (Card c : drawn) {
										if (window != null) {
											window.animate(c, false, true, hideCount--);
											while (window.animating != null) {
												Thread.sleep(1);
												window.repaint();
											}
										}
										log += ",1";
									}
								} else {
									for (Card c : drawn) {
										if (window != null) {
											window.animate(c, true, true, hideCount--);
											while (window.animating != null) {
												Thread.sleep(1);
												window.repaint();
											}
										}
										log += "," + c;
									}
								}
								do {
									boolean s1Turn = game.s1Turn;
									q = game.pickUpIfCantMove();

									if (window != null) {
										if (q != null) {
											window.animate(q, s1Turn, true);
										}
										while (window.animating != null) {
											Thread.sleep(1);
											window.repaint();
										}
									}
									if (q != null) {
										if (s1Turn) {
											log += "," + q;
										} else {
											log += ",1";
										}
									}
								} while (q != null);
								log += ",0";

								log += "," + game.deck.size();
								log += game.s1Turn ? ",1" : ",2";
								over = false;
							}
						} catch (OutOfCardsException e) {
							log += ",0,0,0";
							draws++;
						}
					}
					rounds++;
				} while (!over);

				if (!ranked && !graphical) {
					System.out.println(log);
					System.out.print(s1Out.substring(0, Math.max(0, s1Out.length() - 1)));
				}
			}
			if (ranked && !graphical) {
				System.out.print("" + wins + "," + loses + "," + draws);
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (!graphical) {
				System.exit(0);
			}
		}

	}

}
