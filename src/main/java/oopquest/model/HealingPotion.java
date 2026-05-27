package oopquest.model;

public class HealingPotion extends Item {
    private final int healAmount;

    public HealingPotion(int healAmount) {
        super("HealingPotion", "Memulihkan HP pemain.");
        this.healAmount = healAmount;
    }

    @Override
    public void use(Pemain player) {
        player.heal(healAmount);
    }

    public int getHealAmount() {
        return healAmount;
    }
}
