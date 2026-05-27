package oopquest.model;

import java.util.Arrays;

public class KuisPilihanGanda extends Kuis {
    private final String[] opsi;

    public KuisPilihanGanda(String pertanyaan, String[] opsi, String jawabanBenar, int poin) {
        super(pertanyaan, jawabanBenar, poin);
        if (opsi == null || opsi.length != 4) {
            throw new IllegalArgumentException("Kuis pilihan ganda harus memiliki 4 opsi.");
        }
        this.opsi = Arrays.copyOf(opsi, opsi.length);
    }

    @Override
    public String tampilkanSoal() {
        return pertanyaan;
    }

    public String[] getOpsi() {
        return Arrays.copyOf(opsi, opsi.length);
    }
}
