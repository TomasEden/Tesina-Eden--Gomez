<?php

require_once 'config.php';

$db = getDB();

$stmt =
$db->query(
"SELECT COUNT(*) as total
FROM usuarios"
);

echo json_encode(
$stmt->fetch()
);