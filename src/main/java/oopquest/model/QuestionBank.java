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

    public Kuis ambilSoalAcakSelain(List<Kuis> kuisYangDikecualikan) {
        if (daftarKuis.isEmpty()) {
            loadQuestions();
        }
        if (daftarKuis.isEmpty()) {
            throw new IllegalStateException("Bank soal masih kosong.");
        }

        List<Kuis> kandidat = new ArrayList<>(daftarKuis);
        if (kuisYangDikecualikan != null) {
            kandidat.removeAll(kuisYangDikecualikan);
        }
        if (kandidat.isEmpty()) {
            return null;
        }
        return kandidat.get(random.nextInt(kandidat.size()));
    }

    public void tambahSoal(Kuis kuis) {
        daftarKuis.add(kuis);
    }

    public List<Kuis> getDaftarKuis() {
        return List.copyOf(daftarKuis);
    }
}
