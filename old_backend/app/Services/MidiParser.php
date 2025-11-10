<?php

namespace App\Services;

use Tmont\Midi\Parsing\FileParser;

class MidiParser
{
    /**
     * Parse MIDI file and extract track information.
     *
     * @param string $filePath Path to the MIDI file
     * @return array Track information
     */
    public function parse(string $filePath): array
    {
        try {
            if (!file_exists($filePath)) {
                throw new \Exception("MIDI file not found: {$filePath}");
            }

            $parser = new FileParser();
            $midi = $parser->parse($filePath);
            
            if (!$midi || !method_exists($midi, 'getTracks')) {
                throw new \Exception("Failed to parse MIDI structure");
            }

            $tracks = [];
            $midiTracks = $midi->getTracks();
            
            if (!$midiTracks) {
                throw new \Exception("No tracks found in MIDI file");
            }

            $trackIndex = 0;
            foreach ($midiTracks as $track) {
                if ($track) {
                    $trackInfo = $this->analyzeTrack($track, $trackIndex);
                    if ($trackInfo) {
                        $tracks[] = $trackInfo;
                    }
                }
                $trackIndex++;
            }

            $timeDivision = method_exists($midi, 'getTimeDivision') ? $midi->getTimeDivision() : 480;

            return [
                'format' => $timeDivision,
                'track_count' => count($tracks),
                'time_division' => $timeDivision,
                'tracks' => $tracks,
                'parsed_at' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            throw new \Exception("Failed to parse MIDI file: " . $e->getMessage());
        }
    }

    /**
     * Analyze a single track.
     *
     * @param mixed $track
     * @param int $index
     * @return array|null
     */
    private function analyzeTrack($track, int $index): ?array
    {
        try {
            if (!method_exists($track, 'getEvents')) {
                return null;
            }

            $events = $track->getEvents();
            if (!$events) {
                return null;
            }

            $noteCount = 0;
            $trackName = "Track " . ($index + 1);
            $instrument = null;
            $channel = null;

            foreach ($events as $event) {
                if (!$event) continue;

                $eventClass = get_class($event);

                // Try to get track name
                if (method_exists($event, 'getData')) {
                    $data = $event->getData();
                    if (is_string($data) && strlen($data) > 0 && strlen($data) < 100) {
                        // Likely a track name
                        if (str_contains($eventClass, 'MetaEvent') || str_contains($eventClass, 'TrackName')) {
                            $trackName = $data;
                        }
                    }
                }

                // Count note events
                if (str_contains($eventClass, 'NoteOn') || str_contains($eventClass, 'NoteOff')) {
                    $noteCount++;
                }

                // Get channel
                if (method_exists($event, 'getChannel') && $channel === null) {
                    try {
                        $channel = $event->getChannel();
                    } catch (\Exception $e) {
                        // Ignore channel errors
                    }
                }

                // Get instrument/program
                if (str_contains($eventClass, 'ProgramChange') && method_exists($event, 'getNumber')) {
                    try {
                        $instrument = $event->getNumber();
                    } catch (\Exception $e) {
                        // Ignore instrument errors
                    }
                }
            }

            // Only return tracks with notes
            if ($noteCount === 0) {
                return null;
            }

            return [
                'track_number' => $index,
                'name' => $trackName,
                'note_count' => $noteCount,
                'channel' => $channel,
                'instrument' => $instrument,
                'suggested_voice' => $this->suggestVoiceName($trackName),
            ];
        } catch (\Exception $e) {
            // Skip tracks that fail to analyze
            return null;
        }
    }

    /**
     * Suggest a voice name based on track name.
     *
     * @param string $trackName
     * @return string|null
     */
    private function suggestVoiceName(string $trackName): ?string
    {
        $trackName = strtolower($trackName);

        // Common voice names
        $voicePatterns = [
            'soprano' => ['soprano', 'sop'],
            'alto' => ['alto', 'alt'],
            'tenor' => ['tenor', 'ten'],
            'bass' => ['bass', 'bas'],
            'piano' => ['piano', 'pno', 'accomp'],
            'organ' => ['organ', 'org'],
        ];

        foreach ($voicePatterns as $voice => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($trackName, $pattern)) {
                    return ucfirst($voice);
                }
            }
        }

        return null;
    }
}
