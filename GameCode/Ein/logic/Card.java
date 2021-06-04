package logic;

public class Card {

	public enum Value {
		ZERO, ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, SKIP, REVERSE, DRAW2, DRAW4, CHANGECOLOR
	}

	public enum Suit {
		RED, GREEN, YELLOW, BLUE, WILD
	}

	public final Value value;
	public final Suit suit;

	public Card(Value value, Suit suit) {
		this.value = value;
		this.suit = suit;
	}

	@Override
	public String toString() {
		return ""+value+"_"+suit;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null) {
			return false;
		}
		if (this == o) {
			return true;
		}
		return o instanceof Card && value == ((Card) o).value && suit == ((Card) o).suit;
	}

	@Override
	public int hashCode() {
		return suit.ordinal()*Value.values().length+value.ordinal();
	}

}
