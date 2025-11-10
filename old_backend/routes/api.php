<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'message' => 'ChoirLoop API is running']);
});

// Songs API endpoints
Route::prefix('songs')->group(function () {
    Route::get('/', [App\Http\Controllers\SongController::class, 'index']);
    Route::post('/', [App\Http\Controllers\SongController::class, 'store']);
    Route::get('/{id}', [App\Http\Controllers\SongController::class, 'show']);
    Route::put('/{id}', [App\Http\Controllers\SongController::class, 'update']);
    Route::delete('/{id}', [App\Http\Controllers\SongController::class, 'destroy']);
    
    // File upload endpoints
    Route::post('/{id}/upload/midi', [App\Http\Controllers\SongController::class, 'uploadMidi']);
    Route::post('/{id}/upload/score', [App\Http\Controllers\SongController::class, 'uploadScore']); // MusicXML
    
    // File serving endpoints
    Route::get('/{id}/midi', [App\Http\Controllers\SongController::class, 'serveMidi']);
    Route::get('/{id}/score', [App\Http\Controllers\SongController::class, 'serveScore']);
    
    // Practice sections endpoints
    Route::get('/{id}/sections', [App\Http\Controllers\PracticeSectionController::class, 'index']);
    Route::post('/{id}/sections', [App\Http\Controllers\PracticeSectionController::class, 'store']);
    Route::put('/{id}/sections/{sectionId}', [App\Http\Controllers\PracticeSectionController::class, 'update']);
    Route::delete('/{id}/sections/{sectionId}', [App\Http\Controllers\PracticeSectionController::class, 'destroy']);
});
