<?php
// db.php — single shared PDO connection for the Apex WebApp
// WAMP MySQL config: port 3306, user "root", empty password.
// Confirmed via WAMP tray icon → Tools → "Port used by MySQL: 3306".
$host = "localhost";
$port = "3306";
$dbname = "apex";
$user = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // throw on SQL errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // rows as assoc arrays
            PDO::ATTR_EMULATE_PREPARES   => false,                 // real prepared statements
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode([
        "success" => false,
        "error"   => "Database connection failed: " . $e->getMessage()
    ]);
    exit;
}