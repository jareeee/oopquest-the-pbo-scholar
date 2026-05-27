package oopquest.model;

public class Score {
    private final String playerName;
    private final int score;
    private final int stageTerakhir;

    public Score(String playerName, int score, int stageTerakhir) {
        this.playerName = playerName;
        this.score = score;
        this.stageTerakhir = stageTerakhir;
    }

    public String getPlayerName() {
        return playerName;
    }

    public int getScore() {
        return score;
    }

    public int getStageTerakhir() {
        return stageTerakhir;
    }
}
