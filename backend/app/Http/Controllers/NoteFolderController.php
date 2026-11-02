<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class NoteFolderController extends Controller
{
    private const MAX_FOLDERS = 30;

    public function index(Request $request)
    {
        $user = $request->user();

        return [
            'folders' => $user->noteFolders()->withCount('notes')->orderBy('name')->get(),
            'totals' => [
                'all' => $user->notes()->count(),
                'unfiled' => $user->notes()->whereNull('folder_id')->count(),
            ],
        ];
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $this->validated($request);

        if ($user->noteFolders()->count() >= self::MAX_FOLDERS) {
            throw ValidationException::withMessages([
                'name' => 'You can have up to '.self::MAX_FOLDERS.' folders. Delete one to add another.',
            ]);
        }

        $folder = $user->noteFolders()->create($data);

        return response()->json($folder->loadCount('notes'), 201);
    }

    public function update(Request $request, string $id)
    {
        $folder = $request->user()->noteFolders()->findOrFail($id);

        $folder->update($this->validated($request, $folder->id));

        return $folder->loadCount('notes');
    }

    public function destroy(Request $request, string $id)
    {
        // the notes inside are kept: the database moves them to "Unfiled"
        $request->user()->noteFolders()->findOrFail($id)->delete();

        return response()->noContent();
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => [
                'required', 'string', 'max:60',
                Rule::unique('note_folders', 'name')
                    ->where('user_id', $request->user()->id)
                    ->ignore($ignoreId),
            ],
        ], [
            'name.unique' => 'You already have a folder with that name.',
        ]);
    }
}