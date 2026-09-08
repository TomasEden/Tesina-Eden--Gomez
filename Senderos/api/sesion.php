<?php

session_start();

if(isset($_SESSION['id']))
{
    echo json_encode([
    "ok"=>true
    ]);
}
else
{
    echo json_encode([
    "ok"=>false
    ]);
}