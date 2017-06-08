# Changelog

## master

An in-progress version being developed on the `master` branch.

## 0.12.1 - June 8th, 2017
### Fixed
- Swap layer show/hide now also calls show/hide on its child layers.

## 0.12.0 - June 6th, 2017
### Added
- This CHANGELOG file to help track changes and ease version migration.

### Changed
- `veldt.Requestor` accepts two separate URLs, one for the WebSocket endpoint and one for the HTTP endpoint.
- `veldt.Requestor` no longer prepends `ws/` in front of the provided WebSocket URL, it must be added explicitly.
