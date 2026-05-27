package oopquest.model;

public abstract class Karakter {
    private final String nama;
    private int hp;
    private final int maxHp;
    protected int attackPower;

    protected Karakter(String nama, int maxHp, int attackPower) {
        this.nama = nama;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.attackPower = attackPower;
    }

    public int serang(Karakter target) {
        int damage = attackPower;
        target.terimaDamage(damage);
        return damage;
    }

    public void terimaDamage(int damage) {
        hp = Math.max(0, hp - Math.max(0, damage));
    }

    public void heal(int jumlah) {
        hp = Math.min(maxHp, hp + Math.max(0, jumlah));
    }

    public boolean isAlive() {
        return hp > 0;
    }

    public String getNama() {
        return nama;
    }

    public int getHp() {
        return hp;
    }

    public int getMaxHp() {
        return maxHp;
    }

    public int getAttackPower() {
        return attackPower;
    }
}
