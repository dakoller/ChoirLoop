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
    Route::post('/{id}/upload/score', [App\Http\Controllers\SongController::class, 'uploadScore']);
    Route::post('/{id}/upload/mp3', [App\Http\Controllers\SongController::class, 'uploadMp3']);
    
    // Practice sections endpoints
    Route::get('/{id}/sections', function ($id) {
        // TODO: Implement PracticeSectionController@index
        return response()->json(['sections' => []]);
    });
    
    Route::post('/{id}/sections', function (Request $request, $id) {
        // TODO: Implement PracticeSectionController@store
        return response()->json(['message' => 'Section creation endpoint - to be implemented'], 501);
    });
    
    Route::put('/{id}/sections/{sectionId}', function (Request $request, $id, $sectionId) {
        // TODO: Implement PracticeSectionController@update
        return response()->json(['message' => 'Section update endpoint - to be implemented'], 501);
    });
    
    Route::delete('/{id}/sections/{sectionId}', function ($id, $sectionId) {
        // TODO: Implement PracticeSectionController@destroy
        return response()->json(['message' => 'Section deletion endpoint - to be implemented'], 501);
    });
});
