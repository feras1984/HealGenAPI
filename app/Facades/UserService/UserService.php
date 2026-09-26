<?php

namespace App\Facades\UserService;

use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static User|null validateEmail($email)
 * @method static void activateUser($data, $user)
 * @method static array updateAvatar(array $data, User $user)
 */
class UserService extends Facade
{
    protected static function getFacadeAccessor(): string
    { return 'UserService'; }
}
