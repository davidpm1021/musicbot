📘 Product Requirements Document (PRD)
Project: D&D Music Bot for Discord
Owner: Dave
Primary Users: Dungeon Masters + players in a private D&D server
Initial Hosting: Local PC
Long-Term Hosting: HP EliteDesk local server (Windows)
1. Product Overview

The D&D Music Bot allows a DM to trigger ambient and battle music during tabletop sessions via Discord voice channels.
The bot plays locally hosted audio files, not YouTube or streaming sources, to avoid TOS issues and ensure reliability.

Primary Goals

Let a DM trigger music with simple Discord commands.

No need for DM to manage JSON or configuration files.

Store music in a shared folder; a script auto-indexes that music into a structured catalog.

Run locally at first, then migrate seamlessly to a dedicated server.

2. High-Level Features
2.1 Music Playback

Play audio in a Discord voice channel using local files on disk.

Support common formats: .mp3, .flac, .wav, .ogg, .m4a.

Commands (native Discord slash commands):

/play <track-id>

/stop

/search <tags>

/reloadtracks (reload tracks.json)

2.2 Track Catalog

Auto-generated from folder structure.

Script scans filesystem and outputs a tracks.json file with the following schema:

{
  "id": "super-battle-theme",
  "name": "Super Battle Theme",
  "file": "D:\\DND-Music\\battle\\intense\\Super Battle Theme.mp3",
  "tags": ["battle", "intense"]
}


id: URL-safe slug used by users (/play track:super-battle-theme)

name: friendly display name from filename

file: absolute file path

tags: derived from subfolder names

2.3 Folder Structure
DND-Music/
  battle/
    intense/
      Super Battle Theme.mp3
    easy/
      Light Skirmish.mp3
  ambience/
    calm/
      Gentle Forest.mp3
  tavern/
    calm/
      Cozy Fireplace.mp3


Folder names represent tags.

2.4 Auto-Index Script

Python script (build_tracks.py) provided by us.

DM never interacts with JSON directly.

Developer must ensure bot reloads catalog cleanly.

3. Functional Requirements
3.1 Core Commands
!play <track-id>

Validates that:

Message author is in a voice channel.

Track exists in tracks.json.

File exists on disk.

Joins the author’s voice channel.

Plays the audio using FFmpeg → PCM → Opus.

!stop

Stops playback.

Leaves the voice channel.

!search <tag list>

Accepts comma-separated tags.

Returns up to 15 results formatted as:

• `super-battle-theme` — Super Battle Theme [battle, intense]


If > 15 results, show count and instruct user to narrow tags.

!reloadtracks

Reloads the tracks.json file in memory.

Safe for use while bot is idle.

4. Technical Requirements
4.1 Runtime Environment

Node.js LTS (18.x or 20.x)

Windows 10 Pro host

Will later run on Windows Server or Windows 10 Pro on the HP EliteDesk.

4.2 Libraries

discord.js (latest v14)

@discordjs/voice

@discordjs/opus

ffmpeg-static

dotenv

4.3 Audio Pipeline

FFmpeg generates PCM from file.

PCM is piped to Discord through @discordjs/voice.

Playback handled by AudioPlayer.

4.4 File Access

Bot must support Windows paths with spaces.

Bot should gracefully handle missing files.

4.5 Reloading

tracks.json must be reloadable without restarting the bot.

5. Discord Application Requirements
5.1 Required Bot Permissions
For Adding the Bot

Use an invite URL with these permissions:

OAuth2 → URL Generator → Bot + Permissions
Bot Permissions Required
Permission	Why
Connect	Join voice channels
Speak	Play audio
Use Voice Activity	Required by DiscordJS to stream audio
Read Messages/View Channels	Listen for message commands
Send Messages	Respond in text channels
Embed Links	Send formatted search results
Attach Files (optional)	For future features
Read Message History	In case of some error responses

NO admin, NO manage server, NO manage channels needed.

Intents Required

Be sure these are enabled in:
Discord Developer Portal → Bot → Privileged Gateway Intents

Required:

Message Content Intent

Guild Members (optional — not required now)

Guild Voice States (required for joining voice)

6. Non-Functional Requirements
6.1 Reliability

Bot should recover from:

voice disconnections

missing files

catalog reload errors

6.2 Maintainability

Track catalog must be auto-generated—no manual editing.

Folder-driven tagging ensures future-proof library expansion.

6.3 Migration Requirements

When moving to the HP server:

Only .env paths need to change.

Music folder + bot folder copied over.

Python + Node installed.

Bot can run via Task Scheduler or NSSM.

7. Out-of-Scope Features (for now)

Autocomplete for track IDs.

Volume control.

Crossfades.

Queues.

Playlists.

Random tag-based auto-selection.

Web dashboard.

All can be added later; not required for first functional version.

8. Acceptance Criteria
Playback

Bot joins a voice channel and plays a local file when user runs !play <id>.

Search

!search battle,intense returns correct filtered results.

Folder-to-Catalog Mapping

Shell script properly creates tracks.json.

Bot reads it correctly.

Error Handling

Responds appropriately when:

DM not in a voice channel.

Track ID not found.

File missing.

FFmpeg errors.

Permissions Validation

Bot can join and speak in voice channels.

Bot can read message content and respond.