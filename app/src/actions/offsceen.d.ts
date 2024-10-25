// offscreen.d.ts

declare module 'offscreen.js' {
	export function startRecording(streamId: string): Promise<void>;
	export function stopRecording(): Promise<void>;

	// Optionally, you can declare the types for the recorder and data variables
	let recorder: MediaRecorder | undefined;
	let data: Blob[];
}