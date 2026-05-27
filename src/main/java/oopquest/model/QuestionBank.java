package oopquest.model;

import oopquest.repository.QuestionRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class QuestionBank {
    private final List<Kuis> daftarKuis;
    private final QuestionRepository questionRepository;
    private final Random random;

    public QuestionBank(QuestionRepository questionRepository) {
        this.daftarKuis = new ArrayList<>();
        this.questionRepository = questionRepository;
        this.random = new Random();
    }

    public void loadQuestions() {
        daftarKuis.clear();
        if (questionRepository != null) {
            daftarKuis.addAll(questionRepository.getAllQuestion());
        }
    }

    public Kuis ambilSoalAcak() {
        if (daftarKuis.isEmpty()) {
            loadQuestions();
        }
        if (daftarKuis.isEmpty()) {
            throw new IllegalStateException("Bank soal masih kosong.");
        }
        return daftarKuis.get(random.nextInt(daftarKuis.size()));
    }

    public void tambahSoal(Kuis kuis) {
        daftarKuis.add(kuis);
    }

    public List<Kuis> getDaftarKuis() {
        return List.copyOf(daftarKuis);
    }
}
