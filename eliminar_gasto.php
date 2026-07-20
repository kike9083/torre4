<?php
include 'db.php';

if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $month = $_GET['month'];
    $year = $_GET['year'];

    $stmt = $conn->prepare("DELETE FROM gastos WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Gasto eliminado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>