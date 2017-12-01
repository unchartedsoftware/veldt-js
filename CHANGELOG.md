# Changelog

## master

An in-progress version being developed on the `master` branch.

## 0.14.5 - Nov 30, 2017
### Added
- `veldt.Layer.Stub` - a simple stubbed-out tile layer that can be extended.

## 0.14.4 - Nov 30, 2017
### Added
- `veldt.Layer.TermsFrequencyCount` to access counts of all terms in a given field
- optional field `fieldType` to `veldt.Layer.TopTermCount` to be able to search fields that do not contain arrays.

## 0.14.3 - Nov 21, 2017
### Added
- Bumped `lumo` dependency version from `0.20.6` to `0.20.7` to be able to zoom and position at the same time.

## 0.14.2 - Oct 17th, 2017
### Added
- `limitBounds` option to `veldt.Layer.Drilldown` and `veldt.Renderer.HTML.Drilldown` to allow a limit to be set on the number of bounds that can be added.

### Fixed
- Fix `veldt.Renderer.HTML.Drilldown` mouse event issue on Linux only.

## 0.14.1 - Oct 16th, 2017
### Added
- `drilldowneditstart`, `drilldownedit`, and `drilldowneditend` events to `veldt.Renderer.HTML.Drilldown`.

### Fixed
- Fix `veldt.Layer.Drilldown` and `veldt.Renderer.HTML.Drilldown` mouse event issues.

## 0.14.0 - Oct 13th, 2017
### Added
- `veldt.Layer.Drilldown` and `veldt.Renderer.HTML.Drilldown` types.

## 0.13.10 - Oct 4th, 2017
### Changed
- Bumped `lumo` dependency version from `0.20.3` to `0.20.4` to fix issue with pixel offsets in DOMHandler.

## 0.13.9 - Oct 3rd, 2017
### Changed
- Bumped `lumo` dependency version from `0.20.1` to `0.20.3`.

## 0.13.8 - Sept 20th, 2017
### Fixed
- `veldt.Requestor` no longer appends the host to the URL if prefixed with `//`.
- Update interface on `veldt.Canvas.Heatmap` to match `veldt.WebGL.Heatmap` renderer.
- `brightness` method correctly renamed to `setBrightness` on `veldt.WebGL.Image` renderer.

## 0.13.7 - Sept 17th, 2017
### Added
- `CanvasRenderer` implementation to the `DomRenderer` class.
- `veldt.Canvas.Heatmap` renderer implementation.

## 0.13.6 - June 19th, 2017
### Changed
- Bumped `lumo` dependency version from `0.18.0` to `0.19.0`.

## 0.13.5 - June 19th, 2017
### Fixed
- Swap layer now spreads out zIndex assignments to child Group layers.

### Changed
- Use new `lumo.RingCollidable` to hit-test only the ring's perimeter.

## 0.13.4 - June 15th, 2017
### Fixed
- Redraw occurring during HTML debounce when layer is hidden.

### Changed
- Bumped `lumo` dependency version from `0.18.0` to `0.19.0`.

## 0.13.3 - June 14th, 2017
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
