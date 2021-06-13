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

	private static final int PREFERRED_WIDTH = 800;
	private static final int PREFERRED_HEIGHT = 800;

	private Window() {
		frame = new JFrame("IcedGabriel Ein");
		frame.setSize(new Dimension(PREFERRED_WIDTH, PREFERRED_HEIGHT));
		frame.setLayout(new BorderLayout());
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

		frame.setVisible(true);
		frame.add(this, BorderLayout.CENTER);
		setSize(WIDTH, HEIGHT);

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

	public void setGame(Program.Game game) {
		this.game = game;
	}

	public static Window newWindow() {
		if (Program.graphical) {
			return new Window();
		}
		return null;
	}

	@Override
	public void paintComponent(Graphics g) {
		super.paintComponent(g);
		Graphics2D g2d = (Graphics2D) g;
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
			RenderingHints.VALUE_ANTIALIAS_OFF);

		g2d.setColor(new Color(0x21094e));
		g2d.fillRect(0, 0, getWidth(), getHeight());

		if (game != null) {
		} else {
		}

		if (Program.lock) {
			Font font = new Font(Font.SANS_SERIF, Font.BOLD, Math.min(50, getWidth()/10));
			g2d.setColor(Color.BLACK);
			g2d.setFont(font);
			String label = "Press Space to Start";
			Rectangle2D r2d = font.getStringBounds(label, new FontRenderContext(null, false, true));
			g2d.drawString(label, Math.round((getWidth()-r2d.getWidth())/2 - r2d.getX()), Math.round((getHeight()-r2d.getHeight())/2 - r2d.getY()));
		}
	}

}
