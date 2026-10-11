# ShatterSea Radio - User Guide

## Setup Status

**Note:** Dave is setting up an always-on server this week, so the bot will work all the time. Until then, the bot only works when Dave's computer is on.

---

## Adding Music

1. **Navigate to the shared music folder:**
   ```
   G:\My Drive\D&D Music\
   ```

2. **Choose or create a subfolder for your track:**
   - Folder names become **tags** for searching
   - Example structure:
   ```
   G:\My Drive\D&D Music\
     battle\
       intense\       -> tags: battle, intense
       easy\          -> tags: battle, easy
     ambience\
       calm\          -> tags: ambience, calm
       spooky\        -> tags: ambience, spooky
     tavern\
       calm\          -> tags: tavern, calm
   ```

3. **Drop your audio file into the folder:**
   - Supported formats: `.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`
   - File name becomes the display name (e.g., `Epic Boss Fight.mp3` -> "Epic Boss Fight")

4. **Tell the bot to scan for new files:**
   In Discord, run:
   ```
   /reloadtracks
   ```
   The bot will scan all folders and update the catalog automatically.

---

## Using the Bot In-Game

### Playing Music

1. **Join a voice channel** in Discord
2. Use the `/play` command:
   ```
   /play track:<start typing>
   ```
3. As you type, **autocomplete** will show matching tracks
4. Select a track and hit Enter

### Stopping Music

```
/stop
```
Stops playback and leaves the voice channel.

### Searching for Tracks

```
/search tags:battle,intense
```
Returns tracks tagged with ALL specified tags.

Without tags:
```
/search
```
Shows total track count.

### Check What's Playing

```
/nowplaying
```

### Health Check

```
/ping
```
Bot responds with "Pong!" if it's running.

---

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `/play track:<name>` | Play a track (with autocomplete) |
| `/stop` | Stop playback, leave channel |
| `/search tags:<tags>` | Search by comma-separated tags |
| `/reloadtracks` | Scan folders for new music |
| `/nowplaying` | Show current track |
| `/ping` | Check if bot is responsive |

---

## Tips

- **Track IDs** are auto-generated from filenames (lowercase, hyphens instead of spaces)
- **Autocomplete** searches both track name and ID
- **Tags** are automatically derived from folder structure - no manual tagging needed
- After adding new music, always run `/reloadtracks` to update the bot

---

## Troubleshooting

**Bot not responding?**
- Check if Dave's computer is on (until server is set up)
- Try `/ping` to test connectivity

**Track not showing in autocomplete?**
- Run `/reloadtracks` to refresh the catalog
- Check file is in correct folder and has supported extension

**No audio playing?**
- Make sure you're in a voice channel before running `/play`
- Check the audio file exists and isn't corrupted

---

Questions? Contact Dave.

### Catalog rebuild access
/reloadtracks requires Manage Server permission. Only one rebuild can run across all servers, with a one-minute cooldown and a two-minute timeout. Rebuild responses are private to the requester.
