# ListenFrame: Your ListenBrainz Stats

ListenFrame is a web application that provides a personalized overview of your listening habits, pulling data directly from ListenBrainz. Simply enter your ListenBrainz username, select a time range, and explore your top artists and releases.

## Idea

The core idea behind ListenFrame is to offer a clean and interactive interface to visualize your listening statistics from ListenBrainz. It allows users to quickly see their most listened-to artists and albums over various periods, providing insights into their musical journey.

## Data Fetching

ListenFrame aggregates data from several sources to provide a rich user experience:

- **ListenBrainz API (`https://api.listenbrainz.org`):** This is the primary data source for fetching your personal listening statistics, including top artists and releases.
- **Cover Art Archive (`https://coverartarchive.org`):** Used to retrieve album cover art for your top releases.
- **MusicBrainz API (`https://musicbrainz.org`):** Utilized to fetch artist metadata and link to external resources like Wikidata.
- **Wikidata API (`https://www.wikidata.org`):** Helps in finding image information for artists.
- **Wikimedia Commons API (`https://commons.wikimedia.org`):** Provides the actual image URLs for artist thumbnails.

## Deno Integration

This project utilizes Deno for dependency management and as a runtime environment.

To run the application, you would typically use Deno tasks.

### Running the application with Deno

To start the development server, use the following command:

```bash
deno task start
```

This will run the app in development mode, and you can view it in your browser, usually at `http://localhost:3000`.

### Building the application with Deno

To build the application for production, use:

```bash
deno task build
```

This will create a production-ready build in the `dist` folder.
