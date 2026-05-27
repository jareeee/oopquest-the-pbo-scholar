package oopquest.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import oopquest.database.DatabaseManager;
import oopquest.engine.GameEngine;
import oopquest.model.Item;
import oopquest.model.Kuis;
import oopquest.model.KuisPilihanGanda;
import oopquest.model.Monster;
import oopquest.model.Pemain;
import oopquest.model.Score;
import oopquest.repository.QuestionRepository;
import oopquest.repository.ScoreRepository;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/game")
public class GameController extends HttpServlet {
    private DatabaseManager databaseManager;
    private QuestionRepository questionRepository;
    private ScoreRepository scoreRepository;

    @Override
    public void init() throws ServletException {
        databaseManager = new DatabaseManager();
        databaseManager.initializeDatabase();
        questionRepository = new QuestionRepository(databaseManager);
        scoreRepository = new ScoreRepository(databaseManager);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String action = request.getParameter("action");
        if ("highscores".equals(action)) {
            showHighScore(response);
            return;
        }
        if ("result".equals(action)) {
            sendJson(response, resultJson(getGameEngine(request, false)));
            return;
        }
        sendJson(response, stateJson(getGameEngine(request, false)));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String action = request.getParameter("action");
        if ("start".equals(action)) {
            startGame(request, response);
        } else if ("answer".equals(action)) {
            submitAnswer(request, response);
        } else if ("useItem".equals(action)) {
            useItem(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            sendJson(response, "{\"error\":\"Action tidak dikenal.\"}");
        }
    }

    public void startGame(HttpServletRequest request, HttpServletResponse response) throws IOException {
        GameEngine gameEngine = new GameEngine(questionRepository, scoreRepository);
        gameEngine.startGame(request.getParameter("playerName"));
        request.getSession(true).setAttribute("gameEngine", gameEngine);
        sendJson(response, stateJson(gameEngine));
    }

    public void submitAnswer(HttpServletRequest request, HttpServletResponse response) throws IOException {
        GameEngine gameEngine = getGameEngine(request, false);
        if (gameEngine == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            sendJson(response, "{\"error\":\"Game belum dimulai.\"}");
            return;
        }
        gameEngine.submitAnswer(request.getParameter("jawaban"));
        sendJson(response, stateJson(gameEngine));
    }

    public void useItem(HttpServletRequest request, HttpServletResponse response) throws IOException {
        GameEngine gameEngine = getGameEngine(request, false);
        if (gameEngine == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            sendJson(response, "{\"error\":\"Game belum dimulai.\"}");
            return;
        }

        int index = parseInt(request.getParameter("index"), 0);
        gameEngine.useItem(index);
        sendJson(response, stateJson(gameEngine));
    }

    public void showHighScore(HttpServletResponse response) throws IOException {
        List<Score> scores = scoreRepository.getHighScores();
        StringBuilder json = new StringBuilder("{\"scores\":[");
        for (int i = 0; i < scores.size(); i++) {
            Score score = scores.get(i);
            if (i > 0) {
                json.append(',');
            }
            json.append("{\"playerName\":").append(jsonString(score.getPlayerName()))
                    .append(",\"score\":").append(score.getScore())
                    .append(",\"stageTerakhir\":").append(score.getStageTerakhir())
                    .append('}');
        }
        json.append("]}");
        sendJson(response, json.toString());
    }

    private GameEngine getGameEngine(HttpServletRequest request, boolean createIfMissing) {
        HttpSession session = request.getSession(createIfMissing);
        if (session == null) {
            return null;
        }
        Object value = session.getAttribute("gameEngine");
        return value instanceof GameEngine ? (GameEngine) value : null;
    }

    private String stateJson(GameEngine gameEngine) {
        if (gameEngine == null || gameEngine.getPlayer() == null) {
            return "{\"started\":false}";
        }

        Pemain player = gameEngine.getPlayer();
        Monster enemy = gameEngine.getCurrentEnemy();
        StringBuilder json = new StringBuilder();
        json.append("{\"started\":true")
                .append(",\"playerName\":").append(jsonString(player.getNama()))
                .append(",\"playerHp\":").append(player.getHp())
                .append(",\"playerMaxHp\":").append(player.getMaxHp())
                .append(",\"monsterName\":").append(jsonString(enemy == null ? "" : enemy.getNama()))
                .append(",\"monsterHp\":").append(enemy == null ? 0 : enemy.getHp())
                .append(",\"monsterMaxHp\":").append(enemy == null ? 0 : enemy.getMaxHp())
                .append(",\"stage\":").append(gameEngine.getNomorStageSaatIni())
                .append(",\"score\":").append(player.getScore())
                .append(",\"gameOver\":").append(gameEngine.isGameOver())
                .append(",\"message\":").append(jsonString(gameEngine.getResultMessage()))
                .append(",\"inventory\":").append(inventoryJson(player))
                .append(",\"question\":").append(questionJson(gameEngine.getCurrentQuestion()))
                .append('}');
        return json.toString();
    }

    private String resultJson(GameEngine gameEngine) {
        if (gameEngine == null || gameEngine.getPlayer() == null) {
            return "{\"started\":false}";
        }
        Pemain player = gameEngine.getPlayer();
        return "{\"started\":true"
                + ",\"playerName\":" + jsonString(player.getNama())
                + ",\"score\":" + player.getScore()
                + ",\"stageTerakhir\":" + gameEngine.getStageTerakhir()
                + ",\"message\":" + jsonString(gameEngine.getResultMessage())
                + "}";
    }

    private String inventoryJson(Pemain player) {
        StringBuilder json = new StringBuilder("[");
        List<Item> items = player.getInventory().getDaftarItem();
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) {
                json.append(',');
            }
            json.append(jsonString(items.get(i).getNama()));
        }
        json.append(']');
        return json.toString();
    }

    private String questionJson(Kuis kuis) {
        if (kuis == null) {
            return "null";
        }
        StringBuilder json = new StringBuilder();
        json.append("{\"pertanyaan\":").append(jsonString(kuis.tampilkanSoal()))
                .append(",\"poin\":").append(kuis.getPoin())
                .append(",\"opsi\":");
        if (kuis instanceof KuisPilihanGanda pilihanGanda) {
            json.append(optionsJson(pilihanGanda.getOpsi()));
        } else {
            json.append("[]");
        }
        json.append('}');
        return json.toString();
    }

    private String optionsJson(String[] opsi) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < opsi.length; i++) {
            if (i > 0) {
                json.append(',');
            }
            json.append(jsonString(opsi[i]));
        }
        json.append(']');
        return json.toString();
    }

    private String jsonString(String value) {
        if (value == null) {
            return "\"\"";
        }
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private int parseInt(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private void sendJson(HttpServletResponse response, String json) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }
}
