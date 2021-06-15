package logic;

import javax.swing.*;
import java.awt.*;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.font.FontRenderContext;
import java.awt.geom.Rectangle2D;

public class Window extends JPanel {

	private Program.Game game;
	JFrame frame;
	private final JScrollPane scrollPane;

	private static final int PREFERRED_WIDTH = 800;
	private static final int PREFERRED_HEIGHT = 800;

	private Card lastFacingCard = null;

	private final int animationMs;

	private Window(int animationMs) {
		this.animationMs = animationMs;
		frame = new JFrame("IcedGabriel Ein");
		frame.setSize(new Dimension(PREFERRED_WIDTH, PREFERRED_HEIGHT));
		frame.setLayout(new BorderLayout());
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

		frame.setVisible(true);
		setSize(WIDTH, HEIGHT);

		scrollPane = new JScrollPane(this);
		scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_ALWAYS);
		scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_NEVER);

		frame.add(scrollPane, BorderLayout.CENTER);

		frame.addKeyListener(new KeyAdapter() {
			@Override
			public void keyPressed(KeyEvent e) {
				super.keyPressed(e);
				if (e.getKeyCode() == KeyEvent.VK_SPACE) {
					Program.lock = false;
				}
			}
		});
	}

	public int getClickedCardIndex(boolean player1, int x, int y) {
		int yMin = player1 ? frame.getContentPane().getHeight()-scrollPane.getHorizontalScrollBar().getHeight()-CARD_HEIGHT-WINDOW_PADDING_Y : WINDOW_PADDING_Y;
		int yMax = yMin + CARD_HEIGHT;

		if (yMin > y || y > yMax) {
			return -1;
		}

		int s1Count = (animating != null && ((me && pickup) || (!me && !pickup))) ? game.s1Hand.size() - hideCount : game.s1Hand.size();
		int s2Count = (animating != null && ((!me && pickup) || (me && !pickup))) ? game.s2Hand.size() - hideCount : game.s2Hand.size();

		int count = player1 ? s1Count : s2Count;
		int totalWidth = count * (CARD_WIDTH + CARD_PADDING) - CARD_PADDING + 2 * WINDOW_PADDING_X;

		int startX = Math.max(WINDOW_PADDING_X, (frame.getWidth() - totalWidth) / 2);


		for (int i=0; i<count; i++) {
			int xMin = startX + i*(CARD_WIDTH+CARD_PADDING);
			int xMax = xMin + CARD_WIDTH;

			if (xMin <= x && x <= xMax) {
				return i;
			}
		}

		return -1;
	}

	public Card animating = null;
	public boolean me = false;
	public boolean pickup = false;
	public long animationStartTime = -1;
	public int hideCount = 0;

	public void animate(Card c, boolean me, boolean pickup, int hideCount) {
		animating = c;
		this.me = me;
		this.pickup = pickup;
		this.hideCount = hideCount;
		this.animationStartTime = System.currentTimeMillis();
	}

	public void animate(Card c, boolean me, boolean pickup) {
		animate(c, me, pickup, 1);
	}

	public void setGame(Program.Game game) {
		this.game = game;
	}

	public static Window newWindow(int animationMs) {
		if (Program.graphical) {
			return new Window(animationMs);
		}
		return null;
	}

	public static final int CARD_WIDTH = 100;
	public static final int CARD_HEIGHT = 168;
	public static final int CARD_PADDING = 10;
	public static final int ROUNDING = 10;
	public static final int WINDOW_PADDING_X = 10;
	public static final int WINDOW_PADDING_Y = 10;

	public static final int CIRCLE_DIAMETER = 60;
	public static final int CIRCLE_THICKNESS = 5;

	public static final int REVERSE_LENGTH = 30;
	public static final float REVERSE_RATIO = 0.3f;
	public static final float REVERSE_TRIANGLE_RATIO = 0.7f;
	public static final float REVERSE_TRIANGLE_ANGLE = 60;

	public static final int FONT_SIZE = 55;

	private String valueToString(Card.Value v) {
		switch (v) {
			case ZERO:
				return "0";
			case ONE:
				return "1";
			case TWO:
				return "2";
			case THREE:
				return "3";
			case FOUR:
				return "4";
			case FIVE:
				return "5";
			case SIX:
				return "6";
			case SEVEN:
				return "7";
			case EIGHT:
				return "8";
			case NINE:
				return "9";
			case DRAW2:
				return "+2";
			case DRAW4:
				return "+4";
			default:
				return "";
		}
	}

	public void drawCard(Graphics2D g2d, Card c, int x, int y) {
		drawCard(g2d, c, x, y, false);
	}

	public void drawCard(Graphics2D g2d, Card c, int x, int y, boolean highlighted) {
		Color col;
		if (c == null) {
			col = Color.RED;
		} else {
			switch (c.suit) {
				case RED:
					col = Color.RED;
					break;
				case YELLOW:
					col = Color.YELLOW;
					break;
				case GREEN:
					col = Color.GREEN;
					break;
				case BLUE:
					col = Color.BLUE;
					break;
				default:
					col = Color.BLACK;
			}
		}


		g2d.setColor(col);
		g2d.fillRoundRect(x, y, CARD_WIDTH, CARD_HEIGHT, ROUNDING, ROUNDING);

		if (highlighted) {
			g2d.setStroke(new BasicStroke(10));
			g2d.setColor(Color.BLACK);
			g2d.drawRoundRect(x, y, CARD_WIDTH, CARD_HEIGHT, ROUNDING, ROUNDING);
			g2d.setStroke(new BasicStroke(5));
			g2d.setColor(new Color(0x21094e));
			g2d.drawRoundRect(x, y, CARD_WIDTH, CARD_HEIGHT, ROUNDING, ROUNDING);
		} else {
			g2d.setStroke(new BasicStroke(2));
			g2d.setColor(Color.BLACK);
			g2d.drawRoundRect(x, y, CARD_WIDTH, CARD_HEIGHT, ROUNDING, ROUNDING);
		}

		float cx = x + CARD_WIDTH / 2f;
		float cy = y + CARD_HEIGHT / 2f;

		g2d.setColor(col == Color.BLACK ? Color.WHITE : Color.BLACK);
		Font font = new Font(Font.SANS_SERIF, Font.BOLD, FONT_SIZE);
		g2d.setFont(font);
		String label = c == null ? "Ein" : valueToString(c.value);
		Rectangle2D r2d = font.getStringBounds(label, new FontRenderContext(null, false, true));
		g2d.drawString(label, Math.round(cx - r2d.getWidth() / 2 - r2d.getX()), Math.round(cy - r2d.getHeight() / 2 - r2d.getY()));

		if (c != null) {
			if (c.value == Card.Value.SKIP) {
				int innerDiameter = CIRCLE_DIAMETER - 2 * CIRCLE_THICKNESS;
				float dx = (float) Math.sqrt(2) / 4 * innerDiameter;
				float dy = (float) Math.sqrt(2) / 4 * innerDiameter;

				g2d.setColor(Color.BLACK);
				g2d.fillOval(Math.round(cx - CIRCLE_DIAMETER / 2f), Math.round(cy - CIRCLE_DIAMETER / 2f), CIRCLE_DIAMETER, CIRCLE_DIAMETER);
				g2d.setColor(col);
				g2d.fillOval(Math.round(cx - innerDiameter / 2f), Math.round(cy - innerDiameter / 2f), innerDiameter, innerDiameter);
				g2d.setColor(Color.BLACK);
				g2d.setStroke(new BasicStroke(CIRCLE_THICKNESS));
				g2d.drawLine(Math.round(cx - dx), Math.round(cy - dy), Math.round(cx + dx), Math.round(cy + dy));
			}

			if (c.value == Card.Value.CHANGECOLOR) {
				int bx = Math.round(cx - CIRCLE_DIAMETER / 2f);
				int by = Math.round(cy - CIRCLE_DIAMETER / 2f);
				g2d.setColor(Color.GREEN);
				g2d.fillArc(bx, by, CIRCLE_DIAMETER, CIRCLE_DIAMETER, 0, 90);
				g2d.setColor(Color.YELLOW);
				g2d.fillArc(bx, by, CIRCLE_DIAMETER, CIRCLE_DIAMETER, 90, 90);
				g2d.setColor(Color.BLUE);
				g2d.fillArc(bx, by, CIRCLE_DIAMETER, CIRCLE_DIAMETER, 180, 90);
				g2d.setColor(Color.RED);
				g2d.fillArc(bx, by, CIRCLE_DIAMETER, CIRCLE_DIAMETER, 270, 90);
			}

			if (c.value == Card.Value.REVERSE) {

				g2d.setColor(Color.BLACK);
				float rdx = (float) Math.sqrt(2) / 2 * REVERSE_LENGTH;
				float rdy = (float) Math.sqrt(2) / 2 * REVERSE_LENGTH;

				for (int i = -1; i <= 1; i += 2) {
					float dx = i * rdx;
					float dy = i * rdy;
					int a = i == -1 ? -45 : 135;
					float bx = cx - dx * REVERSE_RATIO;
					float by = cy + dy * REVERSE_RATIO;

					int[] xs = new int[]{Math.round(bx), Math.round(bx + dx), Math.round(bx + dx * (1 - REVERSE_RATIO)), Math.round(bx)};
					int[] ys = new int[]{Math.round(by), Math.round(by - dy), Math.round(by - dy * (1 + REVERSE_RATIO)), Math.round(by - dy * 2 * REVERSE_RATIO)};
					g2d.fillPolygon(xs, ys, 4);
					g2d.fillArc(Math.round(bx + REVERSE_RATIO * (dx - REVERSE_LENGTH)), Math.round(by - REVERSE_RATIO * (dy + REVERSE_LENGTH)), Math.round(2 * REVERSE_LENGTH * REVERSE_RATIO), Math.round(2 * REVERSE_LENGTH * REVERSE_RATIO), a, 90);
				}

				g2d.setColor(col);
				g2d.setStroke(new BasicStroke(CIRCLE_THICKNESS));
				g2d.drawLine(Math.round(cx + rdx), Math.round(cy - rdy), Math.round(cx - rdx), Math.round(cy + rdy));

				g2d.setColor(Color.BLACK);
				for (int i = -1; i <= 1; i += 2) {
					float dx = i * rdx;
					float dy = i * rdy;
					float bx = cx - dx * REVERSE_RATIO;
					float by = cy + dy * REVERSE_RATIO;

					float tbx = bx - 0.5f * dx * REVERSE_RATIO + dx;
					float tby = by - 0.5f * dy * REVERSE_RATIO - dy;

					float v1x = tbx + dx * REVERSE_TRIANGLE_RATIO * 0.5f;
					float v1y = tby + dy * REVERSE_TRIANGLE_RATIO * 0.5f;

					float v2x = tbx - dx * REVERSE_TRIANGLE_RATIO * 0.5f;
					float v2y = tby - dy * REVERSE_TRIANGLE_RATIO * 0.5f;


					float h = (float) Math.tan(Math.PI / 180 * REVERSE_TRIANGLE_ANGLE) * (0.5f * REVERSE_TRIANGLE_RATIO);

					float v3x = tbx + h * dx;
					float v3y = tby - h * dy;

					int[] txs = new int[]{Math.round(v1x), Math.round(v2x), Math.round(v3x)};
					int[] tys = new int[]{Math.round(v1y), Math.round(v2y), Math.round(v3y)};
					g2d.fillPolygon(txs, tys, 3);
				}

			}
		}

	}


	@Override
	public void paintComponent(Graphics g) {
		super.paintComponent(g);
		Graphics2D g2d = (Graphics2D) g;
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
			RenderingHints.VALUE_ANTIALIAS_ON);
		g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
			RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

		g2d.setColor(new Color(0x21094e));
		g2d.fillRect(0, 0, getWidth(), getHeight());

		scrollPane.setBounds(0, 0, frame.getWidth(), frame.getContentPane().getHeight());

		if (game != null) {
			int s1Count = (animating != null && ((me && pickup) || (!me && !pickup))) ? game.s1Hand.size() - hideCount : game.s1Hand.size();
			int s2Count = (animating != null && ((!me && pickup) || (me && !pickup))) ? game.s2Hand.size() - hideCount : game.s2Hand.size();


			int myTotalWidth = s1Count * (CARD_WIDTH + CARD_PADDING) - CARD_PADDING + 2 * WINDOW_PADDING_X;
			int opponentTotalWidth = s2Count * (CARD_WIDTH + CARD_PADDING) - CARD_PADDING + 2 * WINDOW_PADDING_X;
			int maxWidth = Math.max(myTotalWidth, opponentTotalWidth);

			int myStart = Math.max(WINDOW_PADDING_X, (frame.getWidth() - myTotalWidth) / 2);
			int opponentStart = Math.max(WINDOW_PADDING_X, (frame.getWidth() - opponentTotalWidth) / 2);

			setPreferredSize(new Dimension(Math.max(getWidth(), maxWidth), frame.getHeight()));

			scrollPane.revalidate();

			g2d.setColor(new Color(0xa9f1df));

			if ((game.s1Turn && !(animating != null && !me)) || (animating != null && me)) {
				g2d.fillRect(0, frame.getContentPane().getHeight() - scrollPane.getHorizontalScrollBar().getHeight() - CARD_HEIGHT - 2 * WINDOW_PADDING_Y, getWidth(), CARD_HEIGHT + 2 * CARD_PADDING);
			} else {
				g2d.fillRect(0, 0, getWidth(), CARD_HEIGHT + 2 * WINDOW_PADDING_Y);
			}


			for (int i = 0; i < s2Count; i++) {
				if (i >= game.s2Hand.size()) {
					break;
				}
				Card c = game.s2Hand.get(i);
				drawCard(g2d, c, opponentStart + i * (CARD_WIDTH + CARD_PADDING), WINDOW_PADDING_Y, !game.s1Turn && game.moveValid(c));
			}

			int cy = Math.round((frame.getContentPane().getHeight() - CARD_HEIGHT - scrollPane.getHorizontalScrollBar().getHeight()) / 2f);
			int cx = Math.round((frame.getWidth() - CARD_PADDING) / 2f);

			Card facingCard = animating != null && !pickup ? lastFacingCard : game.lastPlayedCard;
			if (facingCard != null) {
				drawCard(g2d, facingCard, cx - CARD_WIDTH, cy);
			}

			if (game.deck.size() > 0) {
				drawCard(g2d, null, cx + CARD_PADDING, cy);
			}


			for (int i = 0; i < s1Count; i++) {
				if (i >= game.s1Hand.size()) {
					break;
				}
				Card c = game.s1Hand.get(i);
				drawCard(g2d, c, myStart + i * (CARD_WIDTH + CARD_PADDING), frame.getContentPane().getHeight() - scrollPane.getHorizontalScrollBar().getHeight() - CARD_HEIGHT - WINDOW_PADDING_Y, game.s1Turn && game.moveValid(c));
			}

			if (animating != null) {
				float animatingTime = (float) (System.currentTimeMillis() - animationStartTime);
				float p = animatingTime / animationMs;
				if (p >= 1) {
					animating = null;
					if (!pickup) {
						lastFacingCard = game.lastPlayedCard;
					}
				} else {
					int startX, startY, endX, endY;

					int deckX = pickup ? cx + CARD_PADDING : cx - CARD_WIDTH;

					int otherX = Math.round((frame.getWidth() - CARD_WIDTH) / 2f);
					int otherY = me ? frame.getContentPane().getHeight() - scrollPane.getHorizontalScrollBar().getHeight() - CARD_HEIGHT - WINDOW_PADDING_Y : WINDOW_PADDING_Y;

					if (pickup) {
						startX = deckX;
						startY = cy;
						endX = otherX;
						endY = otherY;
					} else {
						startX = otherX;
						startY = otherY;
						endX = deckX;
						endY = cy;
					}

					int x = Math.round(startX + (endX - startX) * p);
					int y = Math.round(startY + (endY - startY) * p);

					drawCard(g2d, animating, x, y);
				}
			}
		}

		if (Program.lock) {
			Font font = new Font(Font.SANS_SERIF, Font.PLAIN, Math.min(50, frame.getWidth() / 10));
			g2d.setFont(font);
			String label = "Press Space to Start";
			Rectangle2D r2d = font.getStringBounds(label, new FontRenderContext(null, false, true));

			int tx = (int) Math.round((frame.getWidth() - r2d.getWidth()) / 2);
			int ty = (int) Math.round((frame.getContentPane().getHeight() - r2d.getHeight()) / 2);
			int xPadding = 50;
			int yPadding = 10;
			int borderRadius = 30;

			g2d.setColor(new Color(0, 0, 0, 128));
			g2d.fillRoundRect(tx - xPadding, ty - yPadding, 2 * xPadding + (int) r2d.getWidth(), 2 * yPadding + (int) r2d.getHeight(), borderRadius, borderRadius);

			g2d.setColor(Color.WHITE);
			g2d.drawString(label, tx - (int) r2d.getX(), ty - (int) r2d.getY());
		}
	}

}
