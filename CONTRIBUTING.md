# Contributing to TechCalc Pro v2

Danke, dass du zu TechCalc Pro beitragen möchtest! 🎉

## 🚀 Wie du anfängst

1. **Fork** das Repository
2. **Clone** deinen Fork: `git clone https://github.com/yourusername/techcalc-v2.git`
3. **Create** einen Branch: `git checkout -b feature/my-feature`
4. **Make** deine Änderungen
5. **Test** lokal: `npm run dev`
6. **Commit**: `git commit -m "feat: add new feature"`
7. **Push**: `git push origin feature/my-feature`
8. **Create** einen Pull Request

## 📋 Checklist für Beiträge

- [ ] Code folgt den Stil-Guidelines
- [ ] Responsive Design getestet (mobile, tablet, desktop)
- [ ] No console errors/warnings
- [ ] Dokumentation aktualisiert
- [ ] Tests durchgeführt (falls applicable)

## 🧩 Module Portieren

Falls du ein neues Modul portierst:

1. Siehe **DOCUMENTATION.md** → Module Porting Checklist
2. Kopiere eine existierende Modul-Komponente als Template
3. Übersetze Logik aus Original JS Datei
4. Test auf allen Breakpoints (390px, 768px, 1024px)
5. Prüfe localStorage Persistierung (falls nötig)
6. Füge Tests hinzu

## 🎨 Style Guide

### JavaScript/React

```javascript
// Use const, avoid var
const myVar = 'value'

// Use arrow functions
const handleClick = () => {
  console.log('clicked')
}

// Use destructuring
const { name, email } = user

// Use template literals
const message = `Hello ${name}`
```

### CSS

```css
/* Use custom properties from tokens.css */
.my-component {
  color: var(--color-text-primary);
  padding: var(--pad-md);
  border-radius: var(--radius-lg);
}

/* Mobile-first responsive */
@media (min-width: 768px) {
  .my-component {
    padding: var(--pad-lg);
  }
}
```

## 🐛 Bug Reports

Erstelle ein Issue mit:

- **Beschreibung**: Was ist das Problem?
- **Steps to Reproduce**: Wie kann man es reproduzieren?
- **Expected Behavior**: Was sollte passieren?
- **Actual Behavior**: Was passiert stattdessen?
- **Screenshot**: Falls applicable
- **Environment**: Browser, OS, Device

## 🎯 Feature Requests

Beschreibe:

- **Goal**: Was möchtest du erreichen?
- **Why**: Warum ist das wichtig?
- **Example**: Wie sollte es funktionieren?

## 📝 Commit Messages

```
feat: add new feature
fix: fix bug in calculation
docs: update documentation
style: format code
refactor: reorganize components
test: add unit tests
chore: update dependencies
```

## 🔄 Pull Request Process

1. Update die Dokumentation
2. Add tests, falls nötig
3. Ensure no breaking changes
4. Request review von Maintainers
5. Respond to feedback
6. Merge wenn approved

## 📚 Weitere Ressourcen

- [README.md](README.md) — Projektübersicht
- [DOCUMENTATION.md](DOCUMENTATION.md) — Technisches Handbuch
- [CSS_REFERENCE.md](CSS_REFERENCE.md) — CSS Cheatsheet

---

**Happy Coding!** 🚀
