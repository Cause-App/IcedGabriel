package logic;

public class Program {

    public static void main(String[] args) {
        Slitherable s1 = new snake1.Snake();
        Slitherable s2 = new snake2.Snake();

        System.out.println(s1.move(0,0,0,0,0,0));
        System.out.println(s2.move(0,0,0,0,0,0));
    }

}
