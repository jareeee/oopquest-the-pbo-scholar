package oopquest.model;

public class Monster extends Karakter {
    private final int rewardPoint;

    public Monster(String nama, int maxHp, int attackPower, int rewardPoint) {
        super(nama, maxHp, attackPower);
        this.rewardPoint = rewardPoint;
    }

    @Override
    public int serang(Karakter target) {
        return super.serang(target);
    }

    public int getRewardPoint() {
        return rewardPoint;
    }
}
