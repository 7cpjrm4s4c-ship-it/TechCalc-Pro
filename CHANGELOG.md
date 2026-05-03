# Changelog

All notable changes to TechCalc Pro v2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-03

### Added
- Complete React refactor from Vanilla JS
- 12-column responsive grid layout (mobile-first)
- Design token system with CSS custom properties
- Light/Dark theme support
- MAG Module (Druckhaltung) - fully functional
- Ventilation Module (Lüftung) - fully functional
- Reusable component library (Input, Card, Button, etc.)
- PWA support (manifest, service worker, offline-first)
- Responsive design at 4 breakpoints (390px, 768px, 1024px, 1440px)

### Improved
- Better code organization and maintainability
- Faster development with Vite (instead of webpack)
- Enhanced accessibility (WCAG 2.1 AA ready)
- Performance improvements (code-splitting, lazy loading)
- Better form handling with React hooks
- Cleaner state management

### Fixed
- Cross-browser compatibility issues
- Mobile layout inconsistencies
- CSS cascade problems
- State management issues

### Deprecated
- Old Vanilla JS implementation
- Manual bundling process
- Legacy CSS structure

### Removed
- jQuery dependencies (if any)
- Old build system

### Security
- Updated all dependencies to latest secure versions
- Implemented Content Security Policy headers

### Technical Debt
- Refactored monolithic JS files into components
- Improved CSS organization with tokens
- Better separation of concerns

## [1.x] - Previous Versions

See original repository for version history.

---

## Planned for Future Releases

- [ ] Entwässerung Module (Drainage)
- [ ] WRG & Mischluft Module (Heat Recovery + Air Mixing)
- [ ] Trinkwasser Module (Drinking Water)
- [ ] Heating/Cooling Module with HX Diagram
- [ ] PDF Export functionality
- [ ] Cloud sync capabilities
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced data visualization (charts, graphs)
- [ ] Unit conversion tools
- [ ] Project saving/loading
- [ ] Collaborative features

---

## Version Information

- **Current**: 2.0.0
- **Status**: Production Ready
- **Release Date**: May 2026
- **Node Version**: 16.0.0+
- **React Version**: 18.2.0+
