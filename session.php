<?php
// api/sessions.php — full CRUD for the focus_sessions table
// Talk to it with fetch() from app.js: GET / POST / PUT / DELETE

header("Content-Type: application/json");
require_once __DIR__ . "/db.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // READ — GET /api/sessions.php or /api/sessions.php?id=5
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM focus_sessions WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            echo json_encode($row ?: ["success" => false, "error" => "Not found"]);
        } else {
            $stmt = $pdo->query("SELECT * FROM focus_sessions ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    // CREATE — POST /api/sessions.php  { user_id, task_title, duration_minutes, status }
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['user_id']) || empty($data['task_title']) || empty($data['duration_minutes'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "user_id, task_title and duration_minutes are required"]);
            break;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO focus_sessions (user_id, task_title, duration_minutes, status)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['user_id'],
            $data['task_title'],
            $data['duration_minutes'],
            $data['status'] ?? 'pending'
        ]);

        echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
        break;

    // UPDATE — PUT /api/sessions.php?id=5  { task_title, duration_minutes, status }
    case 'PUT':
        if (empty($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "id is required"]);
            break;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        $stmt = $pdo->prepare(
            "UPDATE focus_sessions
             SET task_title = ?, duration_minutes = ?, status = ?
             WHERE id = ?"
        );
        $stmt->execute([
            $data['task_title'],
            $data['duration_minutes'],
            $data['status'] ?? 'pending',
            $_GET['id']
        ]);

        echo json_encode(["success" => true, "updated" => $stmt->rowCount()]);
        break;

    // DELETE — DELETE /api/sessions.php?id=5
    case 'DELETE':
        if (empty($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "id is required"]);
            break;
        }

        $stmt = $pdo->prepare("DELETE FROM focus_sessions WHERE id = ?");
        $stmt->execute([$_GET['id']]);

        echo json_encode(["success" => true, "deleted" => $stmt->rowCount()]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed"]);
}