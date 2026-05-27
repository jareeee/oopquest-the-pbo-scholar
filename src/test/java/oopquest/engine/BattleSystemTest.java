package oopquest.engine;

import oopquest.model.Kuis;
import oopquest.model.KuisPilihanGanda;
import oopquest.model.Monster;
import oopquest.model.Pemain;
import oopquest.model.QuestionBank;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BattleSystemTest {

    @Test
    void jawabanBenarMembuatPemainMenyerangDanMenambahScore() {
        QuestionBank bank = new QuestionBank(null);
        Kuis kuis = new KuisPilihanGanda(
                "Apa blueprint untuk object?",
                new String[]{"Class", "Object", "Method", "Package"},
                "A",
                15
        );
        bank.tambahSoal(kuis);
        Pemain pemain = new Pemain("Scholar");
        Monster monster = new Monster("Compile Error", 50, 8, 20);
        BattleSystem battle = new BattleSystem(bank);
        battle.mulaiBattle(pemain, monster);

        boolean benar = battle.prosesTurnPemain("A");

        assertTrue(benar);
        assertEquals(25, monster.getHp());
        assertEquals(15, pemain.getScore());
    }

    @Test
    void jawabanSalahMembuatMonsterMenyerangPemain() {
        QuestionBank bank = new QuestionBank(null);
        bank.tambahSoal(new KuisPilihanGanda(
                "Keyword pewarisan class di Java?",
                new String[]{"implements", "extends", "new", "return"},
                "B",
                10
        ));
        Pemain pemain = new Pemain("Scholar");
        Monster monster = new Monster("Logic Error", 40, 12, 20);
        BattleSystem battle = new BattleSystem(bank);
        battle.mulaiBattle(pemain, monster);

        boolean benar = battle.prosesTurnPemain("A");

        assertFalse(benar);
        assertEquals(88, pemain.getHp());
        assertEquals(40, monster.getHp());
    }
}
