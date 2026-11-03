# Trabant 601 Limousine – 3D-Antriebsstrang

Interaktive 3D-Webanwendung (Three.js) des Motorraums und Antriebsstrangs des Trabant 601 Limousine im Maßstab 1:1.

**Neu in Version 2:** Karosserie aus Einzelteilen nach Ersatzteilkatalog (Duroplast-Beplankung, Stahlgerippe, Scheiben, Anbauteile) in Lichtblau, Türen/Motorhaube/Kofferraumdeckel zum Öffnen, Ansichten Lackiert/Innenleben/Ohne Karosserie, Motorraum nach Originalfotos, Auspuffanlage nach Tafel F 55, Innenraum mit Pedalen, Ausrollen bei getretener Kupplung, Fahrbahnbuckel mit Einfedern.

**Inhalt:** Motor P63 (2-Zylinder-Zweitakt, 594,5 cm³) mit Kurbeltrieb, Zündanlage (Kerzen, Spulen, Zündkabel, Unterbrecher, Batterie), Kraftstoffanlage (Fallbehälter, Hahn, Filter, Schlauch, BVF-Vergaser, Luftfilter), Axialgebläse mit Keilriemen, Kupplung, Getriebe G 50 S mit Freilauf, Differential, Gelenkwellen, Vorder- und Hinterachse, Lenkung, Trommelbremsen, Räder 145 SR 13, Plattformrahmen und Karosserie-Silhouette.

**Bedienung:** Ziehen dreht, Mausrad/Pinch zoomt, Rechtsklick/zwei Finger verschieben. Bauteile per Klick oder im Baum wählen. Unten: Drehzahl, Explosion, Lenkeinschlag, Gang, Kupplung.

## Lokal starten
Die Seite lädt Three.js als ES-Modul vom CDN. Deshalb einen kleinen Webserver verwenden statt die Datei per Doppelklick zu öffnen:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

## Veröffentlichung
`.github/workflows/deploy.yml` veröffentlicht bei jedem Push auf `main` automatisch auf GitHub Pages
(einmalig unter *Settings → Pages → Source* „GitHub Actions“ wählen).

Hinweis: Maße und Kennwerte nach Werksangaben; einzelne Details (z. B. Pleuellänge, Gangübersetzungen) sind als „ca.“ gekennzeichnete Modellwerte.

## Quellen bearbeiten
Im Ordner `quelle/` liegen `app.html` (App) und `body.js` (Karosserie). `python3 quelle/build.py` (im Ordner `quelle` ausführen) setzt beides zu `index.html` zusammen.
