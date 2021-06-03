package logic;

import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class Program {

	private static int MOVE_MAX_MILLIS;

	private static class OutOfCardsException extends RuntimeException {};

	private static class PlayerThread implements Runnable {
		private final Game game;
		private final UnoPlayerInterface player;
		private final boolean s1;

		public PlayerThread(Game game, UnoPlayerInterface player, boolean s1) {
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
				System.setOut(ps);
				System.setErr(ps);
				List<Card> hand;
				if (s1) {
					hand = game.s1Hand;
				} else {
					hand = game.s2Hand;
				}
				Card d = player.playCard(game.lastPlayedCard, hand.toArray(new Card[hand.size()]));
				game.move = d;
			} catch (Exception e) {
				throw e;
			} finally {
				System.setOut(stdout);
				System.setErr(stderr);
				if (s1) {
					game.s1Out = baos.toString();
				}
			}
		}
	}

	private static class Game {
		private static final int CARDS_PER_HAND = 7;

		private final LinkedList<Card> deck;
		private final List<Card> s1Hand;
		private final List<Card> s2Hand;

		private Card lastPlayedCard;
		private List<Card> played;
		private boolean s1Turn;

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
			for (Card.Suit s: new Card.Suit[]{Card.Suit.RED, Card.Suit.GREEN, Card.Suit.YELLOW, Card.Suit.BLUE}) {
				deck.add(new Card(Card.Value.ZERO, s));
				for (Card.Value v: new Card.Value[]{Card.Value.ONE, Card.Value.TWO, Card.Value.THREE, Card.Value.FOUR, Card.Value.FIVE, Card.Value.SIX, Card.Value.SEVEN, Card.Value.EIGHT, Card.Value.NINE, Card.Value.DRAW2, Card.Value.SKIP, Card.Value.REVERSE}) {
					deck.add(new Card(v, s));
					deck.add(new Card(v, s));
				}
			}
			for (Card.Value v: new Card.Value[]{Card.Value.DRAW4, Card.Value.CHANGECOLOR}) {
				for (int i=0; i<4; i++) {
					deck.add(new Card(v, Card.Suit.WILD));
				}
			}
			Collections.shuffle(deck);

			s1Hand = new ArrayList<>();
			s2Hand = new ArrayList<>();
			s1Turn = new Random().nextBoolean();
			List<Card> h1 = s1Turn? s2Hand: s1Hand;
			List<Card> h2 = s1Turn? s1Hand: s2Hand;
			for (int i=0; i<CARDS_PER_HAND; i++) {
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
			for (Card c: hand) {
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

		public void makeMove() {
			played.add(lastPlayedCard);
			lastPlayedCard = move;
			List<Card> hand = s1Turn ? s1Hand : s2Hand;
			List<Card> otherHand = s1Turn ? s2Hand : s1Hand;
			hand.remove(move);

			canPickColor = false;

			if (move.value == Card.Value.DRAW2) {
				mustPickUp2 += 1;
				boolean canBeCountered = false;
				for (Card x: otherHand) {
					if (x.value == Card.Value.DRAW2) {
						canBeCountered = true;
						break;
					}
				}
				if (canBeCountered) {
					s1Turn = !s1Turn;
				} else {
					for (int i=0; i<mustPickUp2*2; i++) {
						otherHand.add(deal());
					}
					mustPickUp2 = 0;
				}
			} else if (move.value == Card.Value.DRAW4) {
				mustPickUp4 += 1;
				boolean canBeCountered = false;
				for (Card x: otherHand) {
					if (x.value == Card.Value.DRAW4) {
						canBeCountered = true;
						break;
					}
				}
				if (canBeCountered) {
					s1Turn = !s1Turn;
				} else {
					for (int i=0; i<mustPickUp4*4; i++) {
						otherHand.add(deal());
					}
					mustPickUp4 = 0;
					canPickColor = true;
				}
			} else if (move.value == Card.Value.CHANGECOLOR) {
				canPickColor = true;
			} else if (move.value != Card.Value.SKIP && move.value != Card.Value.REVERSE) {
				s1Turn = !s1Turn;
			}
		}
	}

	private static String encode(String x) {
		return x.replace("\r", "").replace("&", "&amp;").replace("\n", "&newline;").replace(":", "&colon;");
	}

	private static Game game;

	public static boolean isCardValid(Card c) {
		return game.moveValid(c);
	}

	public static void main(String[] args) {
		if (args.length < 2) {
			System.err.println("Expected 2 arguments but only received "+args.length);
			System.exit(1);
		}

		MOVE_MAX_MILLIS = Integer.parseInt(args[0]);
		int numberOfGames = Integer.parseInt(args[1]);
		boolean ranked = numberOfGames >= 0;
		if (!ranked) {
			numberOfGames = 1;
		}


		String log = "";

		ExecutorService executor = Executors.newSingleThreadExecutor();


		String s1Out = "";

		boolean over;
		int rounds = 0;
		try {
			int wins = 0;
			int loses = 0;
			int draws = 0;
			for (int gameNum=0; gameNum < numberOfGames; gameNum++) {
				game = new Game();

				PlayerThread s1 = new PlayerThread(game, new unoplayer1.UnoPlayer(), true);
				PlayerThread s2 = new PlayerThread(game, new unoplayer2.UnoPlayer(), false);


				log += game.deck.size()+","+game.s1Hand.size()+","+game.s2Hand.size();

				for (Card c: game.s1Hand) {
					log += ","+c;
				}
				for (Card c: game.s2Hand) {
					log += ","+c;
				}

				log += ","+ game.lastPlayedCard;
				log += game.s1Turn ? ",1" : ",2";

				Card p;
				List<Card> s1Pickup = new ArrayList<>();
				List<Card> s2Pickup = new ArrayList<>();
				do {
					boolean s1Turn = game.s1Turn;
					p = game.pickUpIfCantMove();
					if (p != null) {
						if (s1Turn) {
							s1Pickup.add(p);
						} else {
							s2Pickup.add(p);
						}
					}
				} while (p != null);

				log += ","+s1Pickup.size();
				for (Card c: s1Pickup) {
					log += ","+c;
				}
				log += ","+s2Pickup.size();
				for (Card c: s2Pickup) {
					log += ","+c;
				}

				do {
					game.newRound();
					over = true;
					Future future = executor.submit(game.s1Turn ? s1: s2);
					try {
						future.get(MOVE_MAX_MILLIS, TimeUnit.MILLISECONDS);
					} catch (TimeoutException | InterruptedException | ExecutionException e) {
						if (game.s1Turn) {
							StringWriter sw = new StringWriter();
							PrintWriter pw = new PrintWriter(sw);
							e.printStackTrace(pw);
							game.s1Out += sw.toString();
						}
						future.cancel(true);
					}

					if (game.s1Out.length() > 0) {
						s1Out += ""+rounds+":"+encode(game.s1Out)+"\n";
					}

					log+=","+game.move;

					if (!game.moveValid()) {
						if (game.s1Turn) {
							log += "0,0,0,2";
							loses++;
						} else {
							log += "0,0,0,1";
							wins++;
						}
					} else {
						try {
							game.makeMove();
							if (game.s1Hand.size() == 0) {
								log += "0,0,0,1";
								wins++;
							} else if (game.s2Hand.size() == 0) {
								log += "0,0,0,2";
								loses++;
							} else {
								Card q;
								s1Pickup = new ArrayList<>();
								s2Pickup = new ArrayList<>();
								do {
									boolean s1Turn = game.s1Turn;
									q = game.pickUpIfCantMove();
									if (q != null) {
										if (s1Turn) {
											s1Pickup.add(q);
										} else {
											s2Pickup.add(q);
										}
									}
								} while (q != null);

								log += ","+s1Pickup.size();
								for (Card c: s1Pickup) {
									log += ","+c;
								}
								log += ","+s2Pickup.size();
								for (Card c: s2Pickup) {
									log += ","+c;
								}
								log += game.s1Turn ? ",1" : ",2";
								over = false;
							}
						} catch (OutOfCardsException e) {
							log += ",0,0";
							draws++;
						}
					}
					rounds++;
				} while (!over);

				if (!ranked) {
					System.out.println(log);
					System.out.print(s1Out.substring(0, Math.max(0,s1Out.length()-1)));
				}
			}
			if (ranked) {
				System.out.print(""+wins+","+loses+","+draws);
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			System.exit(0);
		}

	}

}
