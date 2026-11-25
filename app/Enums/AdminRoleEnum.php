<?php

namespace App\Enums;

enum AdminRoleEnum: string
{
     case ADMINISTRATOR = 'Administrator';
     case EXPERT = 'Expert';
     case INSPECTOR = 'Inspector';
     case EMPLOYEE = 'Employee';
}
