# CSS-Auslieferung und Kaskade

Die CSS-Quelldateien bleiben nach Tokens, Komponenten, Modulen und Theme geordnet.
Die Reihenfolge ihrer Links in `index.html` ist die verbindliche Kaskadenreihenfolge.
Die frühere zusätzliche `@import`-Einbindung von `module-spacing-contract.css`
war redundant, weil dieselbe Datei später ohnehin als Stylesheet geladen wird.

`npm run build:minified` liest die eingebundenen Quelldateien in dieser
Reihenfolge, bündelt und minimiert sie mit esbuild und schreibt
`dist/css/techcalc.bundle.css`. Das Deploy-`index.html` lädt nur dieses
Stylesheet. Der Deploy-Service-Worker lädt ebenfalls nur das CSS-Bundle vor;
alle übrigen Laufzeitdateien behalten ihre bisherigen Einzelpfade. Die
Quellversion verwendet weiterhin ihre einzelnen CSS-Dateien. Relative CSS-URLs
und unaufgelöste Importe brechen den Build ab, bis deren Pfade eindeutig
umgesetzt sind.

`npm run audit:artifacts` kontrolliert die Links, Offline-Liste und Dateihashes.
Die GitHub-CI prüft das Artefakt zusätzlich im Browser auf Desktop und Mobil.
Die Bündelung senkt die Anzahl der renderblockierenden CSS-Anfragen des
Deploy-Artefakts von 27 auf eine. Eine Verbesserung der realen Ladezeit wird
nicht behauptet, bevor sie unter realistischen Netzwerkbedingungen gemessen ist.

Die Autorendateien enthalten weiterhin historisch gewachsene Theme-Overrides
und `!important`-Deklarationen. Deren Bereinigung erfordert Vergleichsbilder
und Kontrastprüfung für Dark, Light und System auf den Zielgeräten. Die
Bündelung ersetzt diese Prüfung nicht.
