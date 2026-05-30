package oopquest.engine;

import oopquest.model.Kuis;
import oopquest.model.KuisPilihanGanda;
import oopquest.model.Monster;
import oopquest.model.Pemain;
import oopquest.model.QuestionBank;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

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

    @Test
    void soalTidakBerulangDalamSatuBattleSampaiBankSoalHabis() throws Exception {
        QuestionBank bank = new QuestionBank(null);
        bank.tambahSoal(buatSoal("Soal 1"));
        bank.tambahSoal(buatSoal("Soal 2"));
        bank.tambahSoal(buatSoal("Soal 3"));
        setSeedRandom(bank, 0);

        Pemain pemain = new Pemain("Scholar");
        Monster monster = new Monster("Long Battle", 200, 1, 20);
        BattleSystem battle = new BattleSystem(bank);
        battle.mulaiBattle(pemain, monster);

        Set<String> soalYangSudahMuncul = new HashSet<>();
        for (int i = 0; i < 3; i++) {
            String pertanyaan = battle.getCurrentQuestion().getPertanyaan();
            assertTrue(soalYangSudahMuncul.add(pertanyaan), "Soal berulang: " + pertanyaan);
            battle.prosesTurnPemain("A");
        }
    }

    private Kuis buatSoal(String pertanyaan) {
        return new KuisPilihanGanda(
                pertanyaan,
                new String[]{"Benar", "Salah 1", "Salah 2", "Salah 3"},
                "A",
                10
        );
    }

    private void setSeedRandom(QuestionBank bank, long seed) throws Exception {
        Field randomField = QuestionBank.class.getDeclaredField("random");
        randomField.setAccessible(true);
        ((Random) randomField.get(bank)).setSeed(seed);
    }
}
