<?php
// auth.php — handles account creation + login for the `users` table
// Called with fetch() from index.html (register) and login.html (login).
// Body: { "action": "register", "username": "...", "email": "...", "password": "..." }
//    or { "action": "login", "email": "...", "password": "..." }

header("Content-Type: application/json");
require_once __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

if ($action === 'register') {

    $username = trim($data['username'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if ($username === '' || $email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Username, email and password are all required"]);
        exit;
    }
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Password must be at least 8 characters"]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
        );
        $stmt->execute([$username, $email, $hash]);

        echo json_encode([
            "success" => true,
            "user" => [
                "id"       => $pdo->lastInsertId(),
                "username" => $username,
                "email"    => $email
            ]
        ]);
    } catch (PDOException $e) {
        // Error code 23000 = unique constraint violation (username or email taken)
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(["success" => false, "error" => "That username or email is already registered"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Could not create account: " . $e->getMessage()]);
        }
    }

} elseif ($action === 'login') {

    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Email and password are required"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, username, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Access denied"]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "user" => [
            "id"       => $user['id'],
            "username" => $user['username'],
            "email"    => $user['email']
        ]
    ]);

} else {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Unknown action"]);
}
