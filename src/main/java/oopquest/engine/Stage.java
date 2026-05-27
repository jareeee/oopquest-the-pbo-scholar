package oopquest.engine;

import oopquest.model.Monster;
import oopquest.model.Pemain;

public class Stage {
    private final int nomor;
    private final Monster musuh;

    public Stage(int nomor, Monster musuh) {
        this.nomor = nomor;
        this.musuh = musuh;
    }

    public boolean mulai(Pemain player, BattleSystem battle) {
        battle.mulaiBattle(player, musuh);
        return player.isAlive();
    }

    public Monster getMusuh() {
        return musuh;
    }

    public int getNomor() {
        return nomor;
    }
}
