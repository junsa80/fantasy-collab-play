# fantasy-collab-play

Public **Godot HTML5** build for [junsa80/fantasy-collab](https://github.com/junsa80/fantasy-collab) (private source, tip `b22f881`).

- **Play:** https://junsa80.github.io/fantasy-collab-play/
- Engine: Godot **4.7.2** (`variant/thread_support=false`)
- License: MIT (see `LICENSE`; upstream framework [kuryart/godot-jrpg](https://github.com/kuryart/godot-jrpg))
- Game owner: **SRPG 개발봇**. Play repo maintained as Pages hosting support.

Safe game materials only (adults fully clothed). No erotica.

## Build note

Web export on this box needs `vram_texture_compression/for_mobile=false` **or** ETC2/ASTC import enabled in project settings (`ResourceImporterTextureSettings.should_import_etc2_astc`). Templates live at `~/.local/share/godot/export_templates/4.7.2.stable/`. See `/workspace/artifacts/jrpg-collab/web-export-notes.md`.
