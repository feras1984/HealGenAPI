<?php

namespace App\Enums;

enum AdminRoleEnum: string
{
     case ADMINISTRATOR = 'Administrator';
     case SUPERVISOR = 'Supervisor';
     case INSPECTOR = 'Inspector';
     case EMPLOYEE = 'Employee';
}
