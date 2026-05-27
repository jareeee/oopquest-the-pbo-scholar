package oopquest.repository;

import oopquest.database.DatabaseManager;
import oopquest.model.Kuis;
import oopquest.model.KuisPilihanGanda;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class QuestionRepository {
    private final DatabaseManager databaseManager;

    public QuestionRepository(DatabaseManager databaseManager) {
        this.databaseManager = databaseManager;
    }

    public List<Kuis> getAllQuestion() {
        String sql = """
                SELECT pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin
                FROM questions
                ORDER BY id
                """;
        List<Kuis> questions = new ArrayList<>();

        try (Connection connection = databaseManager.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            while (resultSet.next()) {
                questions.add(mapRow(resultSet));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal mengambil data soal.", e);
        }

        return questions;
    }

    public Kuis getRandomQuestion() {
        String sql = """
                SELECT pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin
                FROM questions
                ORDER BY RANDOM()
                LIMIT 1
                """;

        try (Connection connection = databaseManager.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            if (resultSet.next()) {
                return mapRow(resultSet);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal mengambil soal acak.", e);
        }

        return null;
    }

    public void insertQuestion(Kuis kuis) {
        if (!(kuis instanceof KuisPilihanGanda pilihanGanda)) {
            throw new IllegalArgumentException("Saat ini hanya KuisPilihanGanda yang didukung.");
        }

        String[] opsi = pilihanGanda.getOpsi();
        String sql = """
                INSERT INTO questions
                (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection connection = databaseManager.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, kuis.getPertanyaan());
            statement.setString(2, opsi[0]);
            statement.setString(3, opsi[1]);
            statement.setString(4, opsi[2]);
            statement.setString(5, opsi[3]);
            statement.setString(6, kuis.getJawabanBenar());
            statement.setInt(7, kuis.getPoin());
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal menyimpan soal.", e);
        }
    }

    private Kuis mapRow(ResultSet resultSet) throws SQLException {
        return new KuisPilihanGanda(
                resultSet.getString("pertanyaan"),
                new String[]{
                        resultSet.getString("opsi_a"),
                        resultSet.getString("opsi_b"),
                        resultSet.getString("opsi_c"),
                        resultSet.getString("opsi_d")
                },
                resultSet.getString("jawaban_benar"),
                resultSet.getInt("poin")
        );
    }
}
