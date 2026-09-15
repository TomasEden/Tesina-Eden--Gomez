<?php
require_once 'config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');
try {
  $db=getDB(); $method=$_SERVER['REQUEST_METHOD'];
  if($method==='GET'){
    if(isset($_GET['fecha'])){
      $st=$db->prepare("SELECT id, fecha, horario, duracion_total, precio_total, servicios, estado FROM turnos WHERE fecha=? ORDER BY horario ASC");
      $st->execute([$_GET['fecha']]); echo json_encode(['ok'=>true,'turnos'=>$st->fetchAll(PDO::FETCH_ASSOC)]); exit;
    }
    if(isset($_GET['propios'])){
      if(!isset($_SESSION['id'])){echo json_encode(['ok'=>false,'error'=>'Debés iniciar sesión']);exit;}
      $st=$db->prepare("SELECT * FROM turnos WHERE usuario_id=? ORDER BY fecha ASC, horario ASC");$st->execute([$_SESSION['id']]);echo json_encode(['ok'=>true,'turnos'=>$st->fetchAll(PDO::FETCH_ASSOC)]);exit;
    }
    $st=$db->query("SELECT t.*, u.nombre AS cliente FROM turnos t LEFT JOIN usuarios u ON u.id=t.usuario_id ORDER BY fecha ASC, horario ASC");echo json_encode(['ok'=>true,'turnos'=>$st->fetchAll(PDO::FETCH_ASSOC)]);exit;
  }
  $data=json_decode(file_get_contents('php://input'),true)?:[];
  if($method==='POST'){
    if(!isset($_SESSION['id'])){echo json_encode(['ok'=>false,'error'=>'Debés iniciar sesión']);exit;}
    $fecha=$data['fecha']??'';$horario=$data['horario']??'';$dur=(int)($data['duracion_total']??30);$precio=(float)($data['precio_total']??0);
    if(!$fecha||!$horario){echo json_encode(['ok'=>false,'error'=>'Faltan fecha u horario']);exit;}
    $inicio=strtotime($fecha.' '.$horario);$fin=$inicio+($dur*60);
    $st=$db->prepare("SELECT id, horario, duracion_total, estado FROM turnos WHERE fecha=? AND estado<>'cancelado'");$st->execute([$fecha]);
    foreach($st->fetchAll(PDO::FETCH_ASSOC) as $t){$ti=strtotime($fecha.' '.$t['horario']);$tf=$ti+((int)($t['duracion_total']?:30)*60);if($inicio<$tf&&$fin>$ti){echo json_encode(['ok'=>false,'error'=>'Ese horario acaba de ser ocupado. Elegí otro.']);exit;}}
    $servicios=json_encode($data['servicios']??[],JSON_UNESCAPED_UNICODE);
    $st=$db->prepare("INSERT INTO turnos (usuario_id, fecha, horario, duracion_total, precio_total, servicios, estado, pedido_id, metodo_pago) VALUES (?,?,?,?,?,?, 'pendiente', ?, ?)");
    $st->execute([$_SESSION['id'],$fecha,$horario,$dur,$precio,$servicios,$data['pedido_id']??null,$data['metodo_pago']??null]);
    echo json_encode(['ok'=>true,'id'=>$db->lastInsertId()]);exit;
  }
  if($method==='PUT'){
    if(!isset($_SESSION['id'])){echo json_encode(['ok'=>false,'error'=>'Debés iniciar sesión']);exit;}
    $st=$db->prepare("UPDATE turnos SET estado=? WHERE id=? AND usuario_id=?");$st->execute([$data['estado']??'cancelado',$data['id']??0,$_SESSION['id']]);echo json_encode(['ok'=>true]);exit;
  }
  echo json_encode(['ok'=>false,'error'=>'Método no permitido']);
} catch(Throwable $e){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>$e->getMessage()]); }
?>
