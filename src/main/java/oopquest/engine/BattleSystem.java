package oopquest.engine;

import oopquest.model.Kuis;
import oopquest.model.Monster;
import oopquest.model.Pemain;
import oopquest.model.QuestionBank;

import java.util.ArrayList;
import java.util.List;

public class BattleSystem {
    private Pemain player;
    private Monster enemy;
    private final QuestionBank questionBank;
    private final List<Kuis> soalYangSudahMuncul;
    private Kuis currentQuestion;
    private String lastMessage;

    public BattleSystem(QuestionBank questionBank) {
        this.questionBank = questionBank;
        this.soalYangSudahMuncul = new ArrayList<>();
        this.lastMessage = "Battle dimulai.";
    }

    public void mulaiBattle(Pemain player, Monster enemy) {
        this.player = player;
        this.enemy = enemy;
        this.soalYangSudahMuncul.clear();
        this.currentQuestion = ambilSoalBerikutnya();
        this.lastMessage = "Stage dimulai. Lawan: " + enemy.getNama() + ".";
    }

    public boolean prosesTurnPemain(String jawaban) {
        if (player == null || enemy == null || currentQuestion == null || cekPemenang() != null) {
            return false;
        }

        boolean benar = player.jawabKuis(currentQuestion, jawaban);
        if (benar) {
            int damage = player.serang(enemy);
            player.tambahScore(currentQuestion.getPoin());
            lastMessage = "Jawaban benar. Pemain menyerang sebesar " + damage + " damage.";
        } else {
            int damage = prosesTurnMonster();
            lastMessage = "Jawaban salah. Musuh menyerang sebesar " + damage + " damage.";
        }

        if (cekPemenang() == null) {
            currentQuestion = ambilSoalBerikutnya();
        }
        return benar;
    }

    public int prosesTurnMonster() {
        if (enemy == null || player == null || !enemy.isAlive() || !player.isAlive()) {
            return 0;
        }
        return enemy.serang(player);
    }

    public String cekPemenang() {
        if (enemy != null && !enemy.isAlive()) {
            return "PLAYER";
        }
        if (player != null && !player.isAlive()) {
            return "MONSTER";
        }
        return null;
    }

    public Pemain getPlayer() {
        return player;
    }

    public Monster getEnemy() {
        return enemy;
    }

    public Kuis getCurrentQuestion() {
        return currentQuestion;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    private Kuis ambilSoalBerikutnya() {
        Kuis kuis = questionBank.ambilSoalAcakSelain(soalYangSudahMuncul);
        if (kuis == null) {
            soalYangSudahMuncul.clear();
            kuis = questionBank.ambilSoalAcak();
        }
        soalYangSudahMuncul.add(kuis);
        return kuis;
    }
}
