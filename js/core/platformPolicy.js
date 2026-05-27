export const platformPolicy = Object.freeze({
  version: '1.3.0',
  principle: 'Design follows Funktion',
  moduleMayOwn: Object.freeze([
    'fachliche Berechnungslogik',
    'fachliche Tabellen und Normwerte',
    'Schema/Metadaten',
    'Validierungsregeln als Daten'
  ]),
  moduleMustNotOwn: Object.freeze([
    'CSS oder modulbezogene UI-Klassen',
    'eigene Eingabekomponenten',
    'eigene Scroll-Fixes',
    'eigene Zahlenparser',
    'eigene Saved-Record-Listen',
    'eigene Ergebnislayout-Komponenten'
  ]),
  allowedCssPrefixes: Object.freeze(['tc-', 'card', 'field', 'control', 'action-', 'result-', 'empty-state', 'inline-', 'module-', 'saved-record', 'line-section'])
});
