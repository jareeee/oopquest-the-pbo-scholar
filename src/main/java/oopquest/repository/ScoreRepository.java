package oopquest.repository;

import oopquest.database.DatabaseManager;
import oopquest.model.Score;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ScoreRepository {
    private final DatabaseManager databaseManager;

    public ScoreRepository(DatabaseManager databaseManager) {
        this.databaseManager = databaseManager;
    }

    public void saveScore(String playerName, int score, int stage) {
        String sql = """
                INSERT INTO scores (player_name, score, stage_terakhir)
                VALUES (?, ?, ?)
                """;

        try (Connection connection = databaseManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, playerName);
            statement.setInt(2, score);
            statement.setInt(3, stage);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal menyimpan score.", e);
        }
    }

    public List<Score> getHighScores() {
        String sql = """
                SELECT player_name, score, stage_terakhir
                FROM scores
                ORDER BY score DESC, stage_terakhir DESC, created_at ASC
                LIMIT 10
                """;
        List<Score> scores = new ArrayList<>();

        try (Connection connection = databaseManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                scores.add(new Score(
                        resultSet.getString("player_name"),
                        resultSet.getInt("score"),
                        resultSet.getInt("stage_terakhir")
                ));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal mengambil high score.", e);
        }

        return scores;
    }
}
