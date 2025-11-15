#!/usr/bin/env python3
"""
Track Indexer for D&D Music Bot

Scans a music folder and generates tracks.json with:
- URL-safe slug IDs derived from filenames
- Display names from filenames
- Absolute file paths
- Tags derived from folder hierarchy
"""

import os
import re
import json
import sys
from pathlib import Path

# Supported audio formats
AUDIO_EXTENSIONS = {'.mp3', '.flac', '.wav', '.ogg', '.m4a'}


def slugify(text):
    """Convert text to URL-safe slug."""
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and underscores with hyphens
    text = re.sub(r'[\s_]+', '-', text)
    # Remove non-alphanumeric characters except hyphens
    text = re.sub(r'[^a-z0-9-]', '', text)
    # Remove multiple consecutive hyphens
    text = re.sub(r'-+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text


def get_display_name(filename):
    """Extract display name from filename (without extension)."""
    return Path(filename).stem


def scan_music_folder(music_path):
    """
    Recursively scan music folder and build track catalog.

    Args:
        music_path: Path to the root music folder

    Returns:
        List of track dictionaries
    """
    tracks = []
    music_root = Path(music_path).resolve()

    if not music_root.exists():
        print(f"Error: Music folder not found: {music_root}")
        sys.exit(1)

    if not music_root.is_dir():
        print(f"Error: Path is not a directory: {music_root}")
        sys.exit(1)

    print(f"Scanning: {music_root}")

    # Track IDs to ensure uniqueness
    seen_ids = {}

    for root, dirs, files in os.walk(music_root):
        root_path = Path(root)

        for filename in files:
            file_path = root_path / filename

            # Check if it's an audio file
            if file_path.suffix.lower() not in AUDIO_EXTENSIONS:
                continue

            # Get display name
            display_name = get_display_name(filename)

            # Generate slug ID
            track_id = slugify(display_name)

            # Handle duplicate IDs by appending number
            if track_id in seen_ids:
                seen_ids[track_id] += 1
                track_id = f"{track_id}-{seen_ids[track_id]}"
            else:
                seen_ids[track_id] = 1

            # Extract tags from folder hierarchy
            relative_path = root_path.relative_to(music_root)
            if relative_path == Path('.'):
                tags = []
            else:
                tags = [part.lower() for part in relative_path.parts]

            # Build track entry
            track = {
                'id': track_id,
                'name': display_name,
                'file': str(file_path),
                'tags': tags
            }

            tracks.append(track)
            print(f"  Found: {track_id} [{', '.join(tags) if tags else 'no tags'}]")

    return tracks


def main():
    # Determine music path
    if len(sys.argv) > 1:
        music_path = sys.argv[1]
    else:
        # Try to read from .env file
        env_path = Path(__file__).parent / '.env'
        music_path = None

        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('MUSIC_PATH='):
                        music_path = line.split('=', 1)[1].strip()
                        # Remove quotes if present
                        if music_path.startswith('"') and music_path.endswith('"'):
                            music_path = music_path[1:-1]
                        elif music_path.startswith("'") and music_path.endswith("'"):
                            music_path = music_path[1:-1]
                        break

        if not music_path:
            print("Usage: python build_tracks.py [MUSIC_PATH]")
            print("Or set MUSIC_PATH in .env file")
            sys.exit(1)

    # Scan and build catalog
    tracks = scan_music_folder(music_path)

    if not tracks:
        print("Warning: No audio files found!")
    else:
        print(f"\nFound {len(tracks)} tracks")

    # Determine output path
    output_path = Path(__file__).parent / 'tracks.json'

    # Write tracks.json
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"Written to: {output_path}")


if __name__ == '__main__':
    main()
