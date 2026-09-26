<?php

namespace App\Facades\UserService\AdminService;

use App\Models\User;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array getAdmins()
 * @method static array getEmployees()
 * @method static array getAdmin(User $user)
 * @method static User store(array $data)
 * @method static User update(array $data, User $user)
 * @method static array updateAvatar(array $data, User $user)
 * @method static User|null validateEmail($email, int|null $id)
 */
class AdminService extends Facade
{
    protected static function getFacadeAccessor(): string
    { return 'AdminService'; }
}
