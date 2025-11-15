const fs = require('fs');
const path = require('path');

class Catalog {
  constructor() {
    this.tracks = [];
    this.tracksFile = process.env.TRACKS_FILE || './tracks.json';
  }

  /**
   * Load tracks from JSON file into memory
   */
  load() {
    const filePath = path.resolve(this.tracksFile);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Tracks file not found: ${filePath}`);
      this.tracks = [];
      return false;
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      this.tracks = JSON.parse(data);
      console.log(`Loaded ${this.tracks.length} tracks from ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error loading tracks file: ${error.message}`);
      this.tracks = [];
      return false;
    }
  }

  /**
   * Reload tracks from disk (hot reload)
   */
  reload() {
    console.log('Reloading track catalog...');
    return this.load();
  }

  /**
   * Get track by ID
   * @param {string} id - Track ID
   * @returns {object|null} Track object or null if not found
   */
  getById(id) {
    return this.tracks.find(track => track.id === id) || null;
  }

  /**
   * Search tracks by tags (AND logic - must match all tags)
   * @param {string[]} tags - Array of tags to search for
   * @returns {object[]} Array of matching tracks
   */
  searchByTags(tags) {
    if (!tags || tags.length === 0) {
      return this.tracks;
    }

    // Normalize tags to lowercase
    const searchTags = tags.map(tag => tag.toLowerCase().trim());

    return this.tracks.filter(track => {
      // Track must have ALL specified tags
      return searchTags.every(searchTag =>
        track.tags.some(trackTag => trackTag.toLowerCase() === searchTag)
      );
    });
  }

  /**
   * Format search results for Discord message
   * @param {object[]} results - Array of track objects
   * @param {number} limit - Max results to show (default 15)
   * @returns {string} Formatted message
   */
  formatSearchResults(results, limit = 15) {
    if (results.length === 0) {
      return 'No tracks found matching those tags.';
    }

    const total = results.length;
    const shown = results.slice(0, limit);

    let message = shown.map(track => {
      const tags = track.tags.length > 0 ? `[${track.tags.join(', ')}]` : '[no tags]';
      return `• \`${track.id}\` — ${track.name} ${tags}`;
    }).join('\n');

    if (total > limit) {
      message += `\n\n*Showing ${limit} of ${total} results. Narrow your search with more specific tags.*`;
    }

    return message;
  }

  /**
   * Get total track count
   */
  get count() {
    return this.tracks.length;
  }
}

module.exports = new Catalog();
