# Changelog

## master

An in-progress version being developed on the `master` branch.

## 0.13.5 - June 19, 2017
### Fixed
- Swap layer now spreads out zIndex assignments to child Group layers.

### Changed
- Use new CircleCollidable option to hit-test only the ring's perimeter.

## 0.13.4 - June 15, 2017
### Fixed
- Redraw occurring during HTML debounce when layer is hidden.

### Changed
- Bumped `lumo` dependency version from `0.18.0` to `0.19.0`.

## 0.13.3 - June 14, 2017
### Changed
- Enhanced BinnedTopHits layer with gridMode layout of top hits, match latest veldt result format.
- Swap layer more robust to missing functions on child layers.

## 0.13.2 - June 9th, 2017
### Fixed
- Switch to newer `lumo` line clipping interface in `veldt.Renderer.WebGL.MacroEdge`.

## 0.13.0 - June 9th, 2017
### Added
- `package-lock.json` file to lock npm dependencies.
- `options.fontColor` argument to `veldt.HTML.CommunityLabel` renderer.
- `options.labelOffset` argument to `veldt.HTML.CommunityLabel` renderer.

### Changed
- Bumped `lumo` dependency version from `0.17.0` to `0.18.0`.

## 0.12.1 - June 8th, 2017
### Fixed
- Swap layer show/hide now also calls show/hide on its child layers.

## 0.12.0 - June 6th, 2017
### Added
- `CHANGELOG.md` file to help track changes and ease version migration.

### Changed
- `veldt.Requestor` accepts two separate URLs, one for the WebSocket endpoint and one for the HTTP endpoint.
- `veldt.Requestor` no longer prepends `ws/` in front of the provided WebSocket URL, it must be added explicitly.
