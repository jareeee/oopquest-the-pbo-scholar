package oopquest.model;

import java.util.ArrayList;
import java.util.List;

public class Inventory {
    private final List<Item> items;

    public Inventory() {
        this.items = new ArrayList<>();
    }

    public void tambahItem(Item item) {
        if (item != null) {
            items.add(item);
        }
    }

    public void gunakanItem(int index, Pemain player) {
        if (index < 0 || index >= items.size()) {
            return;
        }
        Item item = items.remove(index);
        item.use(player);
    }

    public List<Item> getDaftarItem() {
        return List.copyOf(items);
    }
}
