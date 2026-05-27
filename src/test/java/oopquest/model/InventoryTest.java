package oopquest.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InventoryTest {

    @Test
    void gunakanHealingPotionMemulihkanHpDanMenghapusItemDariInventory() {
        Pemain pemain = new Pemain("Scholar");
        pemain.terimaDamage(40);
        pemain.getInventory().tambahItem(new HealingPotion(25));

        pemain.getInventory().gunakanItem(0, pemain);

        assertEquals(85, pemain.getHp());
        assertEquals(0, pemain.getInventory().getDaftarItem().size());
    }
}
