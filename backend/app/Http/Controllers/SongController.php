<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SongController extends Controller
{
    private $dataPath = 'data';
    private $indexFile = 'data/index.json';

    /**
     * Display a listing of songs.
     */
    public function index()
    {
        // Read the index file
        if (!file_exists(base_path($this->indexFile))) {
            return response()->json(['songs' => []]);
        }

        $index = json_decode(file_get_contents(base_path($this->indexFile)), true);
        return response()->json(['songs' => $index ?? []]);
    }

    /**
     * Store a newly created song.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Generate unique ID for the song
        $songId = Str::uuid()->toString();
        $songDir = base_path("{$this->dataPath}/songs/{$songId}");

        // Create song directory
        if (!file_exists($songDir)) {
            mkdir($songDir, 0755, true);
        }

        // Create song configuration
        $config = [
            'id' => $songId,
            'title' => $request->title,
            'description' => $request->description ?? '',
            'midi_file' => null,
            'score_file' => null,
            'mp3_files' => [],
            'voices' => [],
            'practice_sections' => [],
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ];

        // Save config.json
        file_put_contents(
            "{$songDir}/config.json",
            json_encode($config, JSON_PRETTY_PRINT)
        );

        // Update index
        $this->updateIndex($config);

        return response()->json([
            'message' => 'Song created successfully',
            'song' => $config
        ], 201);
    }

    /**
     * Display the specified song.
     */
    public function show(string $id)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$id}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $config = json_decode(file_get_contents($configPath), true);
        return response()->json(['song' => $config]);
    }

    /**
     * Update the specified song.
     */
    public function update(Request $request, string $id)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$id}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'voices' => 'sometimes|array',
        ]);

        $config = json_decode(file_get_contents($configPath), true);

        // Update fields
        if ($request->has('title')) {
            $config['title'] = $request->title;
        }
        if ($request->has('description')) {
            $config['description'] = $request->description;
        }
        if ($request->has('voices')) {
            $config['voices'] = $request->voices;
        }

        $config['updated_at'] = now()->toIso8601String();

        // Save updated config
        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        // Update index
        $this->updateIndex($config);

        return response()->json([
            'message' => 'Song updated successfully',
            'song' => $config
        ]);
    }

    /**
     * Remove the specified song.
     */
    public function destroy(string $id)
    {
        $songDir = base_path("{$this->dataPath}/songs/{$id}");

        if (!file_exists($songDir)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        // Delete song directory recursively
        $this->deleteDirectory($songDir);

        // Remove from index
        $this->removeFromIndex($id);

        return response()->json(['message' => 'Song deleted successfully']);
    }

    /**
     * Upload MIDI file for a song.
     */
    public function uploadMidi(Request $request, string $id)
    {
        $request->validate([
            'midi' => 'required|file|mimes:mid,midi|max:10240', // 10MB max
        ]);

        $songDir = base_path("{$this->dataPath}/songs/{$id}");
        $configPath = "{$songDir}/config.json";

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        // Save MIDI file
        $file = $request->file('midi');
        $filename = 'song.mid';
        $file->move($songDir, $filename);

        // Update config
        $config = json_decode(file_get_contents($configPath), true);
        $config['midi_file'] = $filename;
        $config['updated_at'] = now()->toIso8601String();

        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'MIDI file uploaded successfully',
            'file' => $filename
        ]);
    }

    /**
     * Upload PDF score for a song.
     */
    public function uploadScore(Request $request, string $id)
    {
        $request->validate([
            'score' => 'required|file|mimes:pdf|max:51200', // 50MB max
        ]);

        $songDir = base_path("{$this->dataPath}/songs/{$id}");
        $configPath = "{$songDir}/config.json";

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        // Save PDF file
        $file = $request->file('score');
        $filename = 'score.pdf';
        $file->move($songDir, $filename);

        // Update config
        $config = json_decode(file_get_contents($configPath), true);
        $config['score_file'] = $filename;
        $config['updated_at'] = now()->toIso8601String();

        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Score uploaded successfully',
            'file' => $filename
        ]);
    }

    /**
     * Upload MP3 file for a voice.
     */
    public function uploadMp3(Request $request, string $id)
    {
        $request->validate([
            'mp3' => 'required|file|mimes:mp3|max:102400', // 100MB max
            'voice' => 'required|string',
        ]);

        $songDir = base_path("{$this->dataPath}/songs/{$id}");
        $configPath = "{$songDir}/config.json";

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        // Save MP3 file
        $file = $request->file('mp3');
        $voice = $request->voice;
        $filename = "{$voice}.mp3";
        $file->move($songDir, $filename);

        // Update config
        $config = json_decode(file_get_contents($configPath), true);
        $config['mp3_files'][$voice] = $filename;
        $config['updated_at'] = now()->toIso8601String();

        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'MP3 file uploaded successfully',
            'file' => $filename
        ]);
    }

    /**
     * Update the index file with song info.
     */
    private function updateIndex($songConfig)
    {
        $indexPath = base_path($this->indexFile);
        
        // Read current index
        $index = file_exists($indexPath) 
            ? json_decode(file_get_contents($indexPath), true) 
            : [];

        // Update or add song
        $found = false;
        foreach ($index as &$song) {
            if ($song['id'] === $songConfig['id']) {
                $song = [
                    'id' => $songConfig['id'],
                    'title' => $songConfig['title'],
                    'description' => $songConfig['description'] ?? '',
                    'updated_at' => $songConfig['updated_at'],
                ];
                $found = true;
                break;
            }
        }

        if (!$found) {
            $index[] = [
                'id' => $songConfig['id'],
                'title' => $songConfig['title'],
                'description' => $songConfig['description'] ?? '',
                'updated_at' => $songConfig['updated_at'],
            ];
        }

        // Save index
        file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT));
    }

    /**
     * Remove song from index.
     */
    private function removeFromIndex($songId)
    {
        $indexPath = base_path($this->indexFile);
        
        if (!file_exists($indexPath)) {
            return;
        }

        $index = json_decode(file_get_contents($indexPath), true);
        $index = array_filter($index, fn($song) => $song['id'] !== $songId);
        
        file_put_contents($indexPath, json_encode(array_values($index), JSON_PRETTY_PRINT));
    }

    /**
     * Recursively delete a directory.
     */
    private function deleteDirectory($dir)
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = "$dir/$file";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
