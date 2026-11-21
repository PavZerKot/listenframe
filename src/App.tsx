import { makeCache } from "@solid-primitives/resource";
import {
	type Component,
	createResource,
	createSignal,
	For,
	type JSXElement,
	type Resource,
	Show,
	Suspense,
} from "solid-js";

const LB_API_URL = `https://api.listenbrainz.org`;
const COVERARTARCHIVE_URL = "https://coverartarchive.org";
const MB_API_URL = "https://musicbrainz.org";

export type Settings = {
	username: string;
	range: Range;
	count: number;
};

export default () => {
	const [settings, setSettings] = createSignal<Settings>({
		username: "",
		range: "this_month",
		count: 10,
	});
	const [artistFetcher] = makeCache(
		(set: Settings) => {
			if (set.username)
				return artists(set.username, undefined, set.range, set.count);
		},
		{
			storage: localStorage,
			sourceHash(source) {
				return `artists-${JSON.stringify(source)}-${new Date().toISOString().split("T")[0]}`;
			},
		},
	);
	const [artistRes] = createResource(settings, artistFetcher);
	const [releasesFetcher] = makeCache(
		(set: Settings) => {
			if (set.username)
				return releases(set.username, undefined, set.range, set.count);
		},
		{
			storage: localStorage,
			sourceHash(source) {
				return `groups-${JSON.stringify(source)}-${new Date().toISOString().split("T")[0]}`;
			},
		},
	);
	const [releasesRes] = createResource(settings, releasesFetcher);

	return (
		<main class="bg-black min-h-screen text-white p-8">
			<div class="m-auto max-w-4xl flex flex-col align-center">
				<h1 class="text-4xl font-bold mb-8 text-center">
					Your ListenBrainz Stats
				</h1>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
					<input
						type="text"
						value={settings().username}
						onChange={(e) => {
							setSettings(() => ({
								...settings(),
								username: e.target.value,
							}));
						}}
						placeholder="Enter username"
						class="p-4 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
					/>
					<select
						value={settings().range}
						onChange={(e) => {
							setSettings(() => ({
								...settings(),
								range: e.target.value as Range,
							}));
						}}
						class="p-4 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto capitalize"
					>
						{ranges.map((r) => (
							<option value={r} class="capitalize">
								{r.split("_").join(" ")}
							</option>
						))}
					</select>
				</div>
				<Suspense
					fallback={<p class="text-center text-gray-400">Loading...</p>}
				>
					<Show
						when={artistRes()}
						fallback={
							<p class="text-center text-gray-400">
								Waiting for a valid username...
							</p>
						}
					>
						<div>
							<div>
								<h2 class="text-2xl font-semibold my-6 text-center">
									Top Artists
								</h2>
								<Artists artists={artistRes()?.artists || []} />
							</div>
							<div>
								<h2 class="text-2xl font-semibold my-6 text-center">
									Top Albums
								</h2>
								<Releases groups={releasesRes()?.releases || []} />
							</div>
						</div>
					</Show>
				</Suspense>
			</div>
		</main>
	);
};

const Artists: Component<{ artists: ArtistStatsArtist[] }> = (props) => {
	return (
		<div class="flex flex-wrap justify-center gap-4">
			<For each={props.artists}>
				{(artist) => <ArtistsItem item={artist} />}
			</For>
		</div>
	);
};

export const ArtistsItem: Component<{ item: ArtistStatsArtist }> = (props) => {
	const [imageFetcher] = makeCache(
		async (artist: ArtistStatsArtist) => {
			if (!artist.artist_mbid) return null;
			return await getWikidataURL(artist.artist_mbid).then((s) =>
				s ? getWikidataThumbnail(s) : null,
			);
		},
		{ storage: localStorage },
	);
	const [image] = createResource(() => props.item, imageFetcher);

	return (
		<CardItem
			imageUrl={image()}
			imageFallbackUrl={`https://placehold.co/100x100/000000/ffffff?text=${props.item.artist_name}`}
			imageLoading={image.loading}
			title={props.item.artist_name}
			subtitle={`${props.item.listen_count} listens`}
			linkUrl={`${MB_API_URL}/artist/${props.item.artist_mbid}`}
			isCircularImage={true}
		/>
	);
};

const Releases: Component<{ groups: Release[] }> = (props) => {
	return (
		<div class="flex flex-wrap justify-center gap-4">
			<For each={props.groups}>
				{(release) => <ReleaseItem item={release} />}
			</For>
		</div>
	);
};

export const ReleaseItem: Component<{ item: Release }> = (props) => {
	const [imageFetcher] = makeCache(
		async (release: Release) => {
			if (!release.caa_release_mbid) return null;
			const result = await getReleaseImageURL(
				"release",
				release.caa_release_mbid,
			);
			return result[0]?.image.replace("http://", "https://");
		},
		{ storage: localStorage },
	);
	const [image] = createResource(() => props.item, imageFetcher);

	return (
		<CardItem
			imageUrl={image()}
			imageFallbackUrl={`https://placehold.co/100x100/000000/ffffff?text=${props.item.release_name}`}
			imageLoading={image.loading}
			title={props.item.release_name}
			subtitle={`${props.item.listen_count} listens`}
			linkUrl={`${MB_API_URL}/release/${props.item.caa_release_mbid}`}
		/>
	);
};

type CardSectionProps<T> = {
	title: string;
	resource: Resource<T[] | undefined>;
	ItemComponent: (props: { item: T }) => JSXElement;
	fallbackMessage: string;
};

export const CardSection = <T,>(props: CardSectionProps<T>) => {
	return (
		<div>
			<h2 class="text-2xl font-semibold my-6 text-center">{props.title}</h2>
			<Show
				when={(props.resource()?.length || 0) > 0}
				fallback={
					<p class="text-center text-gray-400">{props.fallbackMessage}</p>
				}
			>
				<div class="flex flex-wrap justify-center gap-4">
					<For each={props.resource()}>
						{(item) => <props.ItemComponent item={item} />}
					</For>
				</div>
			</Show>
		</div>
	);
};

type CardItemProps = {
	imageUrl: string | null | undefined;
	imageFallbackUrl: string;
	imageLoading: boolean;
	title: string;
	subtitle: string;
	linkUrl: string;
	isCircularImage?: boolean;
};

export const CardItem: Component<CardItemProps> = (props) => {
	return (
		<div class="group relative w-40 p-4 rounded-lg bg-gray-900 transition-all duration-300 hover:bg-gray-800 cursor-pointer">
			<Show
				when={!props.imageLoading}
				fallback={
					<div
						class={`relative w-32 h-32 mx-auto mb-4 bg-gray-700 animate-pulse ${props.isCircularImage ? "rounded-full" : "rounded-lg"}`}
					></div>
				}
			>
				<img
					src={props.imageUrl || props.imageFallbackUrl}
					alt={`Thumbnail for ${props.title}`}
					class={`w-32 h-32 mx-auto object-cover shadow-lg mb-4 transition-all duration-300 group-hover:scale-105 ${props.isCircularImage ? "rounded-full" : "rounded-lg"}`}
				/>
			</Show>
			<p class="text-white text-center font-bold text-base truncate mb-1">
				<a target="_blank" href={props.linkUrl}>
					{props.title}
				</a>
			</p>
			<p class="text-gray-500 text-base truncate mb-1">{props.subtitle}</p>
		</div>
	);
};

const ranges = ["this_week", "this_month", "this_year", "all_time"] as const;
export type Range = (typeof ranges)[number];

export type ArtistStats = {
	artists: ArtistStatsArtist[];
	count: number;
	from_ts: number;
	last_updated: number;
	offset: number;
	range: Range;
	to_ts: number;
	total_artist_count: number;
	user_id: string;
};

type ArtistStatsArtist = {
	artist_mbid: string;
	artist_name: string;
	listen_count: number;
};

export type ReleasesStats = {
	count: number;
	from_ts: number;
	last_updated: number;
	offset: number;
	range: string;
	releases: Release[];
	to_ts: number;
	total_release_count: number;
	user_id: string;
};

export interface Release {
	artist_mbids: string[];
	artist_name: string;
	artists?: Artist[];
	caa_id?: number;
	caa_release_mbid?: string;
	listen_count: number;
	release_mbid: string;
	release_name: string;
}

export interface Artist {
	artist_credit_name: string;
	artist_mbid: string;
	join_phrase: string;
}

async function artists(
	user: string,
	offset: number = 0,
	range: Range = "this_week",
	count: number = 5,
): Promise<ArtistStats> {
	const url = new URL(`${LB_API_URL}/1/stats/user/${user}/artists`);

	url.searchParams.set("offset", offset.toString());
	url.searchParams.set("range", range);
	url.searchParams.set("count", count.toString());

	return getPayload(url);
}

async function releases(
	user: string,
	offset: number = 0,
	range: Range = "this_week",
	count: number = 5,
): Promise<ReleasesStats> {
	const url = new URL(`${LB_API_URL}/1/stats/user/${user}/releases`);

	url.searchParams.set("offset", offset.toString());
	url.searchParams.set("range", range);
	url.searchParams.set("count", count.toString());

	return getPayload(url);
}

async function getPayload<T>(url: URL): Promise<T> {
	const response = await fetch(url, {});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = await response.json();

	return (data as { payload: T }).payload;
}

export interface Image {
	approved: boolean;
	back: boolean;
	comment: string;
	edit: number;
	front: boolean;
	id: number;
	image: string;
	thumbnails: Thumbnails;
	types: string[];
}

export interface Thumbnails {
	"1200": string;
	"250": string;
	"500": string;
	large: string;
	small: string;
}

const defaultHeaders = {
	"User-Agent": "listenframe/0.1",
};

async function getReleaseImageURL(
	kind: "release" | "release-group",
	mbid: string,
): Promise<Image[]> {
	const url = new URL(`${COVERARTARCHIVE_URL}/${kind}/${mbid}`);

	const response = await fetch(url, {});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = await response.json();

	return (data as { images: Image[] }).images;
}

async function getWikidataURL(mbid: string): Promise<string | null> {
	const url = new URL(`${MB_API_URL}/ws/2/artist/${mbid}`);

	url.searchParams.set("inc", "url-rels");

	const response = await fetch(url, {});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const parser = new DOMParser();

	const doc = parser.parseFromString(await response.text(), "text/xml");

	return doc?.querySelector("[type=wikidata] > target")?.textContent || null;
}

async function getWikidataThumbnail(
	wikidataUrl: string,
): Promise<string | null> {
	try {
		const urlParts = wikidataUrl.split("/");
		const wikidataId = urlParts[urlParts.length - 1];
		if (!wikidataId || !wikidataId.startsWith("Q")) {
			console.error("Invalid Wikidata URL.");
			return null;
		}

		const wikidataApiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
		const wikidataResponse = await fetch(wikidataApiUrl, {
			headers: defaultHeaders,
		});
		const wikidataData = await wikidataResponse.json();

		const claims = wikidataData.entities[wikidataId]?.claims;
		const imageClaim = claims?.P18?.[0]; // P18 is the property ID for 'image'

		if (!imageClaim) {
			console.log("No image found for this Wikidata item.");
			return null;
		}

		const imageFilename = imageClaim.mainsnak.datavalue.value;
		if (!imageFilename) {
			console.error("Could not extract image filename.");
			return null;
		}

		const commonsApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${imageFilename}&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*`;
		const commonsResponse = await fetch(commonsApiUrl, {
			headers: defaultHeaders,
		});
		const commonsData = await commonsResponse.json();

		const pages = commonsData.query.pages;
		const pageId = Object.keys(pages)[0];
		const imageUrl = pages[pageId]?.imageinfo?.[0]?.thumburl;

		if (!imageUrl) {
			console.error("Could not find image URL.");
			return null;
		}

		return imageUrl;
	} catch (error) {
		console.error("An error occurred:", error);
		return null;
	}
}
