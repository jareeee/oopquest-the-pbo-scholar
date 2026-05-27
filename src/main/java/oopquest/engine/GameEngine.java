package oopquest.engine;

import oopquest.model.BossMonster;
import oopquest.model.HealingPotion;
import oopquest.model.Kuis;
import oopquest.model.Monster;
import oopquest.model.Pemain;
import oopquest.model.QuestionBank;
import oopquest.repository.QuestionRepository;
import oopquest.repository.ScoreRepository;

import java.util.ArrayList;
import java.util.List;

public class GameEngine {
    private final List<Stage> stages;
    private int currentStage;
    private final ScoreRepository scoreRepository;
    private final QuestionBank questionBank;
    private BattleSystem battleSystem;
    private Pemain player;
    private boolean gameOver;
    private boolean resultSaved;
    private String resultMessage;

    public GameEngine(QuestionRepository questionRepository, ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
        this.questionBank = new QuestionBank(questionRepository);
        this.stages = new ArrayList<>();
        this.currentStage = 0;
        this.gameOver = false;
        this.resultSaved = false;
        this.resultMessage = "";
        setupStages();
        this.questionBank.loadQuestions();
    }

    public void startGame() {
        startGame("Player");
    }

    public void startGame(String playerName) {
        String nama = playerName == null || playerName.isBlank() ? "Player" : playerName.trim();
        this.player = new Pemain(nama);
        this.player.getInventory().tambahItem(new HealingPotion(30));
        this.player.getInventory().tambahItem(new HealingPotion(30));
        this.currentStage = 0;
        this.gameOver = false;
        this.resultSaved = false;
        this.resultMessage = "Game dimulai.";
        mulaiStageSaatIni();
    }

    public void nextStage() {
        currentStage++;
        if (currentStage >= stages.size()) {
            gameOver = true;
            resultMessage = "Selamat, semua stage selesai.";
            saveResult();
            return;
        }
        player.getInventory().tambahItem(new HealingPotion(25));
        mulaiStageSaatIni();
    }

    public void showResult() {
        if (resultMessage == null || resultMessage.isBlank()) {
            resultMessage = gameOver ? "Game selesai." : "Game masih berlangsung.";
        }
    }

    public void saveResult() {
        if (!resultSaved && player != null) {
            scoreRepository.saveScore(player.getNama(), player.getScore(), getStageTerakhir());
            resultSaved = true;
        }
    }

    public boolean submitAnswer(String jawaban) {
        if (gameOver || battleSystem == null) {
            return false;
        }

        boolean benar = battleSystem.prosesTurnPemain(jawaban);
        String pemenang = battleSystem.cekPemenang();
        if ("PLAYER".equals(pemenang)) {
            Monster defeatedEnemy = battleSystem.getEnemy();
            player.tambahScore(defeatedEnemy.getRewardPoint());
            resultMessage = "Stage " + getNomorStageSaatIni() + " selesai. Reward +" + defeatedEnemy.getRewardPoint() + ".";
            nextStage();
        } else if ("MONSTER".equals(pemenang)) {
            gameOver = true;
            resultMessage = "Game over. Pemain kalah pada stage " + getNomorStageSaatIni() + ".";
            saveResult();
        } else {
            resultMessage = battleSystem.getLastMessage();
        }
        return benar;
    }

    public void useItem(int index) {
        if (!gameOver && player != null) {
            player.getInventory().gunakanItem(index, player);
            resultMessage = "HealingPotion digunakan.";
        }
    }

    public Kuis getCurrentQuestion() {
        return battleSystem == null ? null : battleSystem.getCurrentQuestion();
    }

    public Pemain getPlayer() {
        return player;
    }

    public Monster getCurrentEnemy() {
        return battleSystem == null ? null : battleSystem.getEnemy();
    }

    public int getNomorStageSaatIni() {
        if (currentStage >= stages.size()) {
            return stages.size();
        }
        return stages.get(currentStage).getNomor();
    }

    public int getStageTerakhir() {
        if (currentStage >= stages.size()) {
            return stages.size();
        }
        return stages.get(currentStage).getNomor();
    }

    public boolean isGameOver() {
        return gameOver;
    }

    public String getResultMessage() {
        return resultMessage;
    }

    public BattleSystem getBattleSystem() {
        return battleSystem;
    }

    private void mulaiStageSaatIni() {
        this.battleSystem = new BattleSystem(questionBank);
        stages.get(currentStage).mulai(player, battleSystem);
    }

    private void setupStages() {
        stages.clear();
        stages.add(new Stage(1, new Monster("Compile Error", 50, 10, 20)));
        stages.add(new Stage(2, new Monster("Runtime Error", 70, 15, 30)));
        stages.add(new Stage(3, new BossMonster("Final Exam", 100, 18, 50, 7)));
    }
}
