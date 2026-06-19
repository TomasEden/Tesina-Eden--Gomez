<?php

define('DB_HOST','localhost');
define('DB_USER','root');
define('DB_PASS','');
define('DB_NAME','senderos_db');

function getDB()
{
    static $pdo = null;

    if($pdo !== null)
    {
        return $pdo;
    }

    $dsn =
    "mysql:host="
    .DB_HOST.
    ";port=3307;dbname="
    .DB_NAME.
    ";charset=utf8mb4";

    try
    {
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS
        );

        return $pdo;
    }
    catch(PDOException $e)
    {
        die($e->getMessage());
    }
}