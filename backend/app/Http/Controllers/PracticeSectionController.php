<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PracticeSectionController extends Controller
{
    private $dataPath = 'data';

    /**
     * Display a listing of practice sections for a song.
     */
    public function index(string $songId)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$songId}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $config = json_decode(file_get_contents($configPath), true);
        return response()->json(['sections' => $config['practice_sections'] ?? []]);
    }

    /**
     * Store a newly created practice section.
     */
    public function store(Request $request, string $songId)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$songId}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $request->validate([
            'label' => 'required|string|max:255',
            'start_measure' => 'required|integer|min:1',
            'start_beat' => 'required|integer|min:1',
            'end_measure' => 'required|integer|min:1',
            'end_beat' => 'required|integer|min:1',
        ]);

        $config = json_decode(file_get_contents($configPath), true);

        // Create new section
        $section = [
            'id' => Str::uuid()->toString(),
            'label' => $request->label,
            'start_measure' => $request->start_measure,
            'start_beat' => $request->start_beat,
            'end_measure' => $request->end_measure,
            'end_beat' => $request->end_beat,
            'created_at' => now()->toIso8601String(),
        ];

        if (!isset($config['practice_sections'])) {
            $config['practice_sections'] = [];
        }

        $config['practice_sections'][] = $section;
        $config['updated_at'] = now()->toIso8601String();

        // Save config
        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Practice section created successfully',
            'section' => $section
        ], 201);
    }

    /**
     * Update a practice section.
     */
    public function update(Request $request, string $songId, string $sectionId)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$songId}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $request->validate([
            'label' => 'sometimes|string|max:255',
            'start_measure' => 'sometimes|integer|min:1',
            'start_beat' => 'sometimes|integer|min:1',
            'end_measure' => 'sometimes|integer|min:1',
            'end_beat' => 'sometimes|integer|min:1',
        ]);

        $config = json_decode(file_get_contents($configPath), true);

        // Find and update section
        $found = false;
        foreach ($config['practice_sections'] as &$section) {
            if ($section['id'] === $sectionId) {
                if ($request->has('label')) {
                    $section['label'] = $request->label;
                }
                if ($request->has('start_measure')) {
                    $section['start_measure'] = $request->start_measure;
                }
                if ($request->has('start_beat')) {
                    $section['start_beat'] = $request->start_beat;
                }
                if ($request->has('end_measure')) {
                    $section['end_measure'] = $request->end_measure;
                }
                if ($request->has('end_beat')) {
                    $section['end_beat'] = $request->end_beat;
                }
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json(['error' => 'Practice section not found'], 404);
        }

        $config['updated_at'] = now()->toIso8601String();

        // Save config
        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Practice section updated successfully'
        ]);
    }

    /**
     * Remove a practice section.
     */
    public function destroy(string $songId, string $sectionId)
    {
        $configPath = base_path("{$this->dataPath}/songs/{$songId}/config.json");

        if (!file_exists($configPath)) {
            return response()->json(['error' => 'Song not found'], 404);
        }

        $config = json_decode(file_get_contents($configPath), true);

        // Filter out the section
        $originalCount = count($config['practice_sections'] ?? []);
        $config['practice_sections'] = array_values(
            array_filter(
                $config['practice_sections'] ?? [],
                fn($section) => $section['id'] !== $sectionId
            )
        );

        if (count($config['practice_sections']) === $originalCount) {
            return response()->json(['error' => 'Practice section not found'], 404);
        }

        $config['updated_at'] = now()->toIso8601String();

        // Save config
        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT));

        return response()->json(['message' => 'Practice section deleted successfully']);
    }
}
