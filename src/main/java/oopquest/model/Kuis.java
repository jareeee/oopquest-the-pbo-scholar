package oopquest.model;

public abstract class Kuis {
    protected String pertanyaan;
    protected String jawabanBenar;
    protected int poin;

    protected Kuis(String pertanyaan, String jawabanBenar, int poin) {
        this.pertanyaan = pertanyaan;
        this.jawabanBenar = jawabanBenar;
        this.poin = poin;
    }

    public abstract String tampilkanSoal();

    public boolean cekJawaban(String jawaban) {
        if (jawaban == null) {
            return false;
        }
        return jawabanBenar.equalsIgnoreCase(jawaban.trim());
    }

    public int getPoin() {
        return poin;
    }

    public String getPertanyaan() {
        return pertanyaan;
    }

    public String getJawabanBenar() {
        return jawabanBenar;
    }
}
