package oopquest.model;

public class BossMonster extends Monster {
    private final int specialDamage;

    public BossMonster(String nama, int maxHp, int attackPower, int rewardPoint, int specialDamage) {
        super(nama, maxHp, attackPower, rewardPoint);
        this.specialDamage = specialDamage;
    }

    @Override
    public int serang(Karakter target) {
        int damage = getAttackPower() + specialDamage;
        target.terimaDamage(damage);
        return damage;
    }

    public int getSpecialDamage() {
        return specialDamage;
    }
}
