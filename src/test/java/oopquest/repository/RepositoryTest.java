package oopquest.repository;

import oopquest.database.DatabaseManager;
import oopquest.model.Kuis;
import oopquest.model.KuisPilihanGanda;
import oopquest.model.Score;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RepositoryTest {

    @Test
    void databaseMenginisialisasiSoalDanMenyimpanHighScore() throws Exception {
        Path db = Files.createTempFile("oopquest-test", ".db");
        DatabaseManager manager = new DatabaseManager("jdbc:sqlite:" + db.toAbsolutePath());
        manager.initializeDatabase();

        QuestionRepository questionRepository = new QuestionRepository(manager);
        ScoreRepository scoreRepository = new ScoreRepository(manager);

        List<Kuis> questions = questionRepository.getAllQuestion();
        assertTrue(questions.size() >= 7);

        Kuis randomQuestion = questionRepository.getRandomQuestion();
        assertNotNull(randomQuestion);

        questionRepository.insertQuestion(new KuisPilihanGanda(
                "Apa hasil instansiasi class?",
                new String[]{"Object", "Package", "Interface", "Constructor"},
                "A",
                10
        ));

        scoreRepository.saveScore("Scholar", 120, 3);
        List<Score> scores = scoreRepository.getHighScores();

        assertEquals("Scholar", scores.get(0).getPlayerName());
        assertEquals(120, scores.get(0).getScore());
        assertEquals(3, scores.get(0).getStageTerakhir());
    }
}
