package oopquest.model;

public class Pemain extends Karakter {
    private int mana;
    private int score;
    private final Inventory inventory;

    public Pemain(String nama) {
        super(nama, 100, 25);
        this.mana = 30;
        this.score = 0;
        this.inventory = new Inventory();
    }

    public boolean jawabKuis(Kuis kuis, String jawaban) {
        return kuis.cekJawaban(jawaban);
    }

    @Override
    public int serang(Karakter target) {
        return super.serang(target);
    }

    public void gunakanItem(Item item) {
        if (item != null) {
            item.use(this);
        }
    }

    public void tambahScore(int poin) {
        score += Math.max(0, poin);
    }

    public int getMana() {
        return mana;
    }

    public void setMana(int mana) {
        this.mana = Math.max(0, mana);
    }

    public int getScore() {
        return score;
    }

    public Inventory getInventory() {
        return inventory;
    }
}
