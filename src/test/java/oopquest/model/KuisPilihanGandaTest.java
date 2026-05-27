package oopquest.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KuisPilihanGandaTest {

    @Test
    void cekJawabanMenerimaPilihanBenarTanpaMemperhatikanHurufBesar() {
        KuisPilihanGanda kuis = new KuisPilihanGanda(
                "Konsep membungkus data dan method disebut apa?",
                new String[]{"Class", "Object", "Encapsulation", "Inheritance"},
                "C",
                10
        );

        assertTrue(kuis.cekJawaban("c"));
        assertFalse(kuis.cekJawaban("A"));
        assertEquals(10, kuis.getPoin());
    }
}
