// Don't forget to add either:
// package einplayer1;
// package einplayer2;

import logic.Program;
import logic.EinPlayerInterface;
import logic.Card;

import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

public class EinPlayer implements EinPlayerInterface {

	private Card clickedCard = null;

	public Card playCard(Card lastPlayedCard, Card[] hand, int opponentHandSize) {

		clickedCard = null;

		Program.addMouseListener(new MouseAdapter() {
			@Override
			public void mouseReleased(MouseEvent e) {
				super.mouseClicked(e);

				int index = Program.getClickedCardIndex(false, e.getX(), e.getY());

				if (index >= 0 && index < hand.length && Program.isCardValid(hand[index])) {
					clickedCard = hand[index];
				}
			}
		});

		while (clickedCard == null) {
			try {
				Thread.sleep(1);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}

		return clickedCard;

	}
}