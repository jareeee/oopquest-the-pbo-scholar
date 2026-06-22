# OOP-Quest: The PBO Scholar

Project Java Web Application sederhana untuk game RPG turn-based berbasis web sebagai media belajar PBO.

## Teknologi

- Java 25
- Java Servlet dengan Jakarta Servlet API
- SQLite + JDBC
- HTML, CSS, JavaScript
- Maven

## Cara Menjalankan

Project ini sudah menyertakan JDK 25 LTS portable dan Maven portable di folder `.tools`, jadi tidak perlu mengubah PATH Windows secara permanen.

1. Buka PowerShell.
2. Masuk ke folder project:
3. Aktifkan JDK 25 dan Maven portable untuk terminal saat ini:

   ```powershell
   $env:JAVA_HOME = (Resolve-Path ".tools\jdk25\jdk-25.0.3+9").Path
   $env:Path = "$env:JAVA_HOME\bin;$((Resolve-Path '.tools\maven\apache-maven-3.9.9\bin').Path);$env:Path"
   ```

4. Jalankan aplikasi dengan Jetty:

   ```powershell
   mvn jetty:run
   ```

5. Buka browser:

   ```text
   http://localhost:8080/oopquest/
   ```

Biarkan terminal tetap terbuka selama aplikasi digunakan.

## Cara Menjalankan di NetBeans

1. Pastikan JDK 25 sudah terpasang dan terdaftar di NetBeans lewat `Tools > Java Platforms`.
2. Buka NetBeans.
3. Pilih `File > Open Project`, lalu pilih folder project ini.
4. Klik kanan project, pilih `Run`.
5. Setelah Jetty selesai start, buka browser:

   ```text
   http://localhost:8080/oopquest/
   ```

Project ini sudah menyertakan `nbactions.xml`, jadi tombol `Run` di NetBeans akan menjalankan Jetty otomatis dengan context path `/oopquest`.

## Build WAR

Jika ingin membuat file WAR untuk dideploy ke Tomcat:

   ```bash
   mvn clean package
   ```

Hasil build ada di:

```text
target\oopquest.war
```

Deploy file tersebut ke Apache Tomcat 10.1 atau server servlet yang mendukung Jakarta Servlet.

## Troubleshooting

Jika port 8080 sudah dipakai atau server lama masih berjalan, cek proses Java:

```powershell
Get-Process java
```

Matikan proses yang menjalankan Jetty:

```powershell
Stop-Process -Id <PID>
```

Ganti `<PID>` dengan angka process id yang muncul dari perintah sebelumnya.

Untuk mengecek versi Java dan Maven yang aktif:

```powershell
java -version
mvn -version
```

## Database

File `oopquest.db` sudah disediakan di root project. Aplikasi juga akan membuat tabel dan seed soal otomatis lewat `DatabaseManager` jika database belum tersedia.

Tabel utama:

- `questions`
- `scores`

## Struktur Utama

- `oopquest.controller`: `GameController`
- `oopquest.engine`: `GameEngine`, `BattleSystem`, `Stage`
- `oopquest.model`: class model OOP game
- `oopquest.database`: `DatabaseManager`
- `oopquest.repository`: `QuestionRepository`, `ScoreRepository`
