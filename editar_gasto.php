<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $month = $_POST['month'];
    $year = $_POST['year'];

    $descripcion = $_POST['descripcion'];
    $efectivo = $_POST['efectivo'];
    $cheques = $_POST['cheques'];
    $detalle_cheque = $_POST['detalle_cheque'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("UPDATE gastos SET descripcion = ?, efectivo = ?, cheques = ?, detalle_cheque = ?, fecha = ? WHERE id = ?");
    $stmt->bind_param("sddssi", $descripcion, $efectivo, $cheques, $detalle_cheque, $fecha, $id);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Gasto actualizado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>