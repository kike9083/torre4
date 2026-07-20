<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $month = $_POST['month'];
    $year = $_POST['year'];

    $descripcion = $_POST['descripcion'];
    $monto = $_POST['monto'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("UPDATE caja_movimientos SET descripcion = ?, monto = ?, fecha = ? WHERE id = ?");
    $stmt->bind_param("sdsi", $descripcion, $monto, $fecha, $id);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Movimiento de caja actualizado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>