package oopquest.model;

public abstract class Item implements Usable {
    private final String nama;
    private final String deskripsi;

    protected Item(String nama, String deskripsi) {
        this.nama = nama;
        this.deskripsi = deskripsi;
    }

    public String getNama() {
        return nama;
    }

    public String getDeskripsi() {
        return deskripsi;
    }

    @Override
    public abstract void use(Pemain player);
}
