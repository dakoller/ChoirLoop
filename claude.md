# Spezifikation: Chor-Übungstool

## 1. Projektziel

Ein browserbasiertes Übungstool für Chöre, mit dem Chormitglieder aus MIDI-Dateien gezielt einzelne Abschnitte üben können. Das Tool ermöglicht die individuelle Steuerung von Chorstimmen mit Fokus auf die eigene Stimme.

-----

## 2. Hauptfunktionen

### 2.1 Datei-Management

- **Upload von MIDI-Dateien** über Browser-Interface
- **Upload von Notenblättern** (PDF, optional MusicXML)
- **Verknüpfung** von MIDI-Datei mit Notenblatt und Konfiguration
- Optional: Unterstützung für MP3-Dateien (alternativ zu MIDI) für besseren iOS-Support

### 2.2 Stimmen-Konfiguration

- Jede MIDI-Spur kann einer Chorstimme zugeordnet werden
- **Flexible Stimmbezeichnungen** pro Lied (z.B. Sopran, Alt, Tenor, Bass, oder Tenor 1, Tenor 2, Bass)
- **Zusätzliche Spuren** wie Solo, Klavier, Begleitung können definiert werden
- Zuordnung: Spur-Nummer → Stimmbezeichnung

### 2.3 Übungsstellen definieren

- **Definition von Übungsstellen** nach:
- Taktnummer (Start und Ende)
- Schlägen innerhalb eines Taktes
- **Label/Name** für jede Übungsstelle (z.B. “Refrain”, “Schwierige Stelle Takt 45”)
- **Editor-Interface** für Chorleiter zur Erstellung/Bearbeitung von Übungsstellen
- Speicherung: Format noch offen (Datenbank oder JSON/YAML-Datei)

### 2.4 Abspielmodi

Drei Übungsmodi mit **individuell einstellbarer Lautstärke** pro Stimme:

1. **Fokus eigene Stimme**: Eigene Stimme laut, andere Stimmen individuell regelbar (stumm bis leise)
1. **Mit Chor**: Eigene Stimme laut, andere Stimmen im Hintergrund (individuell regelbar)
1. **Ohne eigene Stimme**: Alle Stimmen außer der eigenen (individuell regelbar)

**Wichtig**: Lautstärke-Einstellungen sind während des Abspielens NICHT änderbar (müssen vor dem Start gesetzt werden)

### 2.5 Loop-Funktion

- **Endlosschleife** für ausgewählte Übungsstellen oder das gesamte Lied
- **Anzahl der Wiederholungen** einstellbar (Standard: 3x, Option für Endlos)
- **Ein Takt Vorzähler** vor jedem Loop-Durchgang
- **Kurze Pause** zwischen Wiederholungen

### 2.6 Tempo-Kontrolle

- **Tempo anpassbar** (langsamer für Üben, schneller für Fortgeschrittene)
- Prozentuale Anpassung (z.B. 50% - 150%)

-----

## 3. Benutzeroberfläche

### 3.1 Hauptansicht

- **Lied-Auswahl** (Dropdown oder Liste)
- **Stimmen-Auswahl** pro Lied (z.B. “Ich bin: Tenor 1”)
- **Playlist-Ansicht** mit allen Übungsstellen
- Anzeige: Label, Takt-Bereich
- Klickbar zum Springen zu einer Stelle
- **Notenblatt-Anzeige** (PDF) neben oder unter der Playlist
- Optional: Synchrones Mitscrollen während des Abspielens
- Optional: Visuelle Hervorhebung der aktuellen Takte

### 3.2 Steuerelemente

- **Play/Pause/Stop**
- **Tempo-Regler** (Slider)
- **Loop-Einstellungen**: Anzahl Wiederholungen, Endlos-Toggle
- **Lautstärke-Mixer**: Slider für jede Stimme
- **Modus-Umschaltung**: Buttons für die drei Abspielmodi
- **Navigation**: Vorherige/Nächste Übungsstelle

### 3.3 Admin/Editor-Bereich (für Chorleiter)

- **Lied anlegen/bearbeiten**
- Titel eingeben
- MIDI-Datei hochladen
- Notenblatt hochladen (optional)
- MP3-Dateien hochladen (optional)
- **Stimmen konfigurieren**
- Anzahl der Spuren aus MIDI automatisch erkennen
- Jeder Spur einen Namen zuweisen (z.B. Spur 1 → “Tenor 1”)
- **Übungsstellen definieren**
- Label eingeben
- Start: Takt, Schlag
- Ende: Takt, Schlag
- Vorschau/Abspielen zur Überprüfung
- Liste aller Übungsstellen mit Bearbeiten/Löschen-Funktionen

-----

## 4. Datenmodell

### 4.1 Lied (Song)

```json
{
"id": "unique-id",
"titel": "Ave Maria",
"midi_datei": "path/to/file.mid",
"notenblatt": "path/to/score.pdf",
"mp3_dateien": {
"tenor1": "path/to/tenor1.mp3",
"tenor2": "path/to/tenor2.mp3"
},
"stimmen": [
{
"spur_nummer": 1,
"name": "Tenor 1"
},
{
"spur_nummer": 2,
"name": "Tenor 2"
},
{
"spur_nummer": 3,
"name": "Bass"
},
{
"spur_nummer": 4,
"name": "Klavier"
}
],
"uebungsstellen": [
{
"id": "stelle-1",
"label": "Refrain",
"start_takt": 12,
"start_schlag": 1,
"ende_takt": 24,
"ende_schlag": 4
},
{
"id": "stelle-2",
"label": "Schwierige Passage",
"start_takt": 45,
"start_schlag": 3,
"ende_takt": 52,
"ende_schlag": 2
}
]
}
```

### 4.2 Benutzer-Präferenzen (Session/Local Storage)

```json
{
"aktuelle_stimme": "Tenor 1",
"lautstaerke": {
"tenor1": 100,
"tenor2": 30,
"bass": 30,
"klavier": 50
},
"tempo": 85,
"loop_count": 3
}
```

-----

## 5. Technische Architektur

### 5.1 Frontend

- **Framework**: Keine Präferenz (React, Vue, vanilla JS möglich)
- **Progressive Web App (PWA)**: Ja, für Offline-Nutzung
- **MIDI-Verarbeitung**:
- Tone.js (empfohlen für robustes Timing und MIDI-Support)
- Alternativ: Web MIDI API + Web Audio API
- **PDF-Anzeige**: PDF.js oder ähnliche Bibliothek
- **MusicXML (optional)**: OpenSheetMusicDisplay oder Verovio

### 5.2 Backend

- **Sprache**: PHP
- **Framework**: Laravel oder Slim (oder vanilla PHP für einfachere Struktur)
- **Funktionen**:
- Datei-Upload (MIDI, PDF, MP3)
- CRUD-Operationen für Lieder und Übungsstellen
- MIDI-Datei-Parsing (PHP-MIDI-Parser oder ähnliche Bibliothek)
- API-Endpunkte (REST)
- **Empfohlene PHP-Bibliotheken**:
- `php-midi-parser` für MIDI-Datei-Analyse
- Standard PHP File-Handling für JSON-Operationen

### 5.3 Datenspeicherung

- **Primär**: JSON-Dateien im Filesystem (datei-basiert)
- **Struktur**: Jedes Lied hat ein eigenes Verzeichnis mit allen zugehörigen Dateien
- **Dateien**: Uploads in strukturiertem Verzeichnis

```
/data
/songs
/song-1
- song.mid
- score.pdf
- config.json # Enthält alle Metadaten, Stimmen, Übungsstellen
- tenor1.mp3 # Optional
- tenor2.mp3 # Optional
/song-2
- song.mid
- score.pdf
- config.json
/index.json # Liste aller verfügbaren Lieder
```
- **Vorteile**:
- Einfache Portabilität
- Kein Datenbank-Setup erforderlich
- Einfaches Backup (gesamtes /data Verzeichnis)
- Übersichtliche Struktur
- **Migration zur Datenbank**: Bei Bedarf später möglich

### 5.4 Browser-Kompatibilität

- **Priorität**: Chrome, Firefox, Safari (Desktop und Mobile)
- **Besondere Beachtung**: Mobile Safari für iOS
- **Fallback**: MP3-Dateien statt MIDI für iOS-Geräte mit schlechtem MIDI-Support

-----

## 6. Workflow

### 6.1 Chorleiter (Admin)

1. Neues Lied anlegen
1. MIDI-Datei hochladen
1. Stimmen automatisch erkennen und benennen
1. Optional: Notenblatt hochladen
1. Übungsstellen definieren (Takt, Schlag, Label)
1. Speichern → Lied ist für Chormitglieder verfügbar

### 6.2 Chormitglied

1. Lied aus Liste auswählen
1. Eigene Stimme wählen
1. Übungsstelle aus Playlist wählen
1. Lautstärken einstellen (eigene laut, andere nach Bedarf)
1. Optional: Tempo anpassen
1. Loop-Einstellungen (3x Standard)
1. Play → Üben mit Vorzähler und automatischem Loop
1. Bei Bedarf: Andere Übungsstelle wählen oder Modus wechseln

-----

## 7. Phasenplan (Optional)

### Phase 1: MVP (Minimum Viable Product)

- MIDI-Upload und Parsing
- Grundlegende Wiedergabe einer Stimme
- Einfache Lautstärke-Steuerung pro Spur
- Manuelle Definition von Start/End-Takten
- Loop-Funktion (Endlos)

### Phase 2: Erweiterungen

- Admin-Interface für Übungsstellen
- Playlist-Ansicht
- Tempo-Kontrolle
- Vorzähler und konfigurierbare Wiederholungen

### Phase 3: Premium Features

- PDF-Notenblatt-Anzeige
- Synchrones Mitscrollen
- MusicXML-Support
- MP3-Fallback für iOS
- PWA-Funktionalität

### Phase 4: Community Features

- Mehrbenutzer-Verwaltung
- Fortschrittstracking
- Teilen von Übungsstellen

-----

## 8. Offene Fragen / Entscheidungen

1. ✅ **Datenbank vs. Datei-basiert**: **Entschieden: Datei-basiert** (JSON-Dateien)
1. **MP3 vs. MIDI**:
- Nur MIDI = einfacher, aber iOS-Probleme
- MP3-Fallback = bessere Kompatibilität, aber mehr Komplexität
1. **M3U-Playlist**:
- Dynamische Generierung aus Übungsstellen
- Format noch zu definieren (falls benötigt)
1. **Authentifizierung**: Wird ein Login-System benötigt oder öffentlicher Zugang?
1. **Nextcloud-Integration**: Für spätere Version vorgesehen
1. **PHP-Framework**: Laravel, Slim oder vanilla PHP?

-----

## 9. Nicht-funktionale Anforderungen

- **Performance**: Flüssiges Abspielen ohne Verzögerungen
- **Benutzerfreundlichkeit**: Intuitive Bedienung auch für weniger technikaffine Chormitglieder
- **Responsive Design**: Nutzbar auf Desktop, Tablet und Smartphone
- **Offline-Fähigkeit**: PWA ermöglicht Nutzung ohne Internetverbindung nach initialem Download
- **Barrierefreiheit**: Grundlegende WCAG-Richtlinien beachten (Kontraste, Tastaturnavigation)

-----

## 10. Mögliche Erweiterungen (Zukunft)

- **Transponierung**: Tonart anpassen für verschiedene Stimmlagen
- **Metronom**: Visuelles oder akustisches Metronom
- **Aufnahme-Funktion**: Eigene Stimme aufnehmen und mit Playback vergleichen
- **Nextcloud-Integration**: Direkter Zugriff auf MIDI-Dateien in der Cloud
- **Mehrstimmigkeit üben**: Zwei Stimmen gleichzeitig lernen
- **Fortschritts-Tracking**: Übungsstunden und Wiederholungen pro Stelle tracken
- **Kollaboratives Üben**: Mehrere Chormitglieder synchron über Internet

-----

## 11. Zusammenfassung

Das Chor-Übungstool ist eine spezialisierte Anwendung für Chorgruppen, die:

- MIDI-Dateien intelligent verarbeitet
- Individuelle Stimmen isoliert und kombiniert abspielt
- Gezielte Übungsstellen ermöglicht
- Flexible Lautstärke- und Tempo-Kontrolle bietet
- Als PWA offline nutzbar ist
- Sowohl für Chorleiter (Administration) als auch Chormitglieder (Üben) optimiert ist

Die Architektur ist modular aufgebaut, um schrittweise erweitert werden zu können, beginnend mit einem funktionalen MVP bis hin zu fortgeschrittenen Features wie Notenblatt-Synchronisation und MP3-Fallbacks.