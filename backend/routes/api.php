<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\BoardMemberController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\StoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/hello', fn () => ['message' => 'Hello from Laravel']);

// public: anyone can call these, so they get the strictest limits
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Request $request) => $request->user());

    // boards
    Route::get('/boards', [BoardController::class, 'index']);
    Route::post('/boards', [BoardController::class, 'store'])->middleware('throttle:creates');
    Route::get('/boards/{board}', [BoardController::class, 'show']);
    Route::match(['put', 'patch'], '/boards/{board}', [BoardController::class, 'update']);
    Route::delete('/boards/{board}', [BoardController::class, 'destroy']);

    // stories
    Route::get('/boards/{board}/stories', [StoryController::class, 'index']);
    Route::post('/boards/{board}/stories', [StoryController::class, 'store'])->middleware('throttle:writes');
    Route::put('/boards/{board}/stories/reorder', [StoryController::class, 'reorder'])->middleware('throttle:writes');
    Route::patch('/stories/{story}', [StoryController::class, 'update'])->middleware('throttle:writes');
    Route::delete('/stories/{story}', [StoryController::class, 'destroy'])->middleware('throttle:writes');

    // sharing
    Route::get('/boards/{board}/members', [BoardMemberController::class, 'index']);
    Route::post('/boards/{board}/invitations', [BoardMemberController::class, 'invite'])->middleware('throttle:invites');
    Route::delete('/boards/{board}/invitations/{invitation}', [BoardMemberController::class, 'cancelInvite']);
    Route::delete('/boards/{board}/members/{user}', [BoardMemberController::class, 'removeMember']);

    // invitations sent to me
    Route::get('/invitations/{invitation}', [InvitationController::class, 'show']);
    Route::post('/invitations/{invitation}/accept', [InvitationController::class, 'accept']);
    Route::post('/invitations/{invitation}/decline', [InvitationController::class, 'decline']);

    // notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('throttle:notifications');
    Route::post('/notifications/read', [NotificationController::class, 'read']);
});