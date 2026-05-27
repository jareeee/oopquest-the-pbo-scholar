package oopquest.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {
    private final String url;

    public DatabaseManager() {
        this("jdbc:sqlite:oopquest.db");
    }

    public DatabaseManager(String url) {
        this.url = url;
    }

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(url);
    }

    public void initializeDatabase() {
        createTables();
        seedQuestionsIfEmpty();
    }

    private void createTables() {
        String createQuestions = """
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pertanyaan TEXT NOT NULL,
                    opsi_a TEXT NOT NULL,
                    opsi_b TEXT NOT NULL,
                    opsi_c TEXT NOT NULL,
                    opsi_d TEXT NOT NULL,
                    jawaban_benar TEXT NOT NULL,
                    poin INTEGER NOT NULL
                )
                """;

        String createScores = """
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    player_name TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    stage_terakhir INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """;

        try (Connection connection = getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(createQuestions);
            statement.execute(createScores);
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal membuat tabel database.", e);
        }
    }

    private void seedQuestionsIfEmpty() {
        String countSql = "SELECT COUNT(*) FROM questions";
        try (Connection connection = getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(countSql)) {
            if (resultSet.next() && resultSet.getInt(1) > 0) {
                return;
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal mengecek data soal.", e);
        }

        insertSeed("Apa yang dimaksud class dalam PBO?",
                "Objek yang sedang berjalan",
                "Blueprint untuk membuat object",
                "Database aplikasi",
                "File konfigurasi server",
                "B", 10);
        insertSeed("Apa hasil dari proses instansiasi sebuah class?",
                "Object", "Package", "Interface", "Modifier", "A", 10);
        insertSeed("Konsep menyembunyikan data dan mengaksesnya melalui method disebut apa?",
                "Inheritance", "Polymorphism", "Encapsulation", "Compilation", "C", 10);
        insertSeed("Keyword Java yang digunakan untuk pewarisan class adalah ...",
                "implements", "extends", "abstract", "private", "B", 10);
        insertSeed("Polymorphism memungkinkan ...",
                "Satu method memiliki perilaku berbeda pada object berbeda",
                "Semua atribut menjadi public",
                "Program tidak membutuhkan class",
                "Database berjalan tanpa koneksi",
                "A", 15);
        insertSeed("Abstract class adalah class yang ...",
                "Tidak dapat memiliki method",
                "Hanya berisi atribut static",
                "Dapat menjadi parent dan tidak selalu bisa diinstansiasi langsung",
                "Selalu harus final",
                "C", 15);
        insertSeed("Interface di Java biasanya digunakan untuk ...",
                "Menyimpan data score",
                "Menentukan kontrak method yang harus diimplementasikan",
                "Menghapus object dari memory",
                "Menjalankan SQL query",
                "B", 15);
    }

    private void insertSeed(String pertanyaan, String opsiA, String opsiB, String opsiC,
                            String opsiD, String jawabanBenar, int poin) {
        String sql = """
                INSERT INTO questions
                (pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, poin)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection connection = getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, pertanyaan);
            statement.setString(2, opsiA);
            statement.setString(3, opsiB);
            statement.setString(4, opsiC);
            statement.setString(5, opsiD);
            statement.setString(6, jawabanBenar);
            statement.setInt(7, poin);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal menambahkan seed soal.", e);
        }
    }
}
