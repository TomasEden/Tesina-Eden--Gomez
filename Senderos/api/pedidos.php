<?php
require_once 'config.php'; session_start(); header('Content-Type: application/json; charset=utf-8');
try{$db=getDB();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){
 if(isset($_GET['id'])){$st=$db->prepare('SELECT * FROM pedidos WHERE id=?');$st->execute([$_GET['id']]);$p=$st->fetch();if(!$p){echo json_encode(['ok'=>false,'error'=>'Pedido no encontrado']);exit;}$si=$db->prepare('SELECT * FROM pedido_items WHERE pedido_id=?');$si->execute([$p['id']]);$p['items']=$si->fetchAll();echo json_encode(['ok'=>true,'pedido'=>$p]);exit;}
 if(isset($_GET['propios'])){if(!isset($_SESSION['id'])){echo json_encode(['ok'=>false,'error'=>'Debés iniciar sesión']);exit;}$st=$db->prepare('SELECT * FROM pedidos WHERE usuario_id=? ORDER BY creado_en DESC');$st->execute([$_SESSION['id']]);$ps=$st->fetchAll();}else{$ps=$db->query('SELECT p.*,u.nombre AS cliente FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id ORDER BY p.creado_en DESC')->fetchAll();}
 $si=$db->prepare('SELECT * FROM pedido_items WHERE pedido_id=?');foreach($ps as &$p){$si->execute([$p['id']]);$p['items']=$si->fetchAll();}echo json_encode(['ok'=>true,'pedidos'=>$ps]);exit;
}
$data=json_decode(file_get_contents('php://input'),true)?:[];
if($method==='POST'){if(!isset($_SESSION['id'])){echo json_encode(['ok'=>false,'error'=>'Debés iniciar sesión']);exit;}$db->beginTransaction();
 $st=$db->prepare('INSERT INTO pedidos (usuario_id,total,estado,metodo_pago,entrega,direccion_envio,pago_grupo) VALUES (?,?,\'pendiente\',?,?,?,?)');$st->execute([$_SESSION['id'],$data['total']??0,$data['metodo_pago']??'efectivo',$data['entrega']??'retiro',$data['direccion_envio']??null,$data['pago_grupo']??'todo']);$id=$db->lastInsertId();
 $si=$db->prepare('INSERT INTO pedido_items (pedido_id,producto_id,servicio_id,tipo,nombre,precio,cantidad) VALUES (?,?,?,?,?,?,?)');foreach(($data['items']??[]) as $it){$si->execute([$id,$it['producto_id']??null,$it['servicio_id']??null,$it['tipo']??'producto',$it['nombre'],$it['precio'],(int)($it['cantidad']??1)]);} $db->commit();echo json_encode(['ok'=>true,'id'=>$id]);exit;}
if($method==='PUT'){ $st=$db->prepare('UPDATE pedidos SET estado=? WHERE id=?');$st->execute([$data['estado']??'pendiente',$data['id']??0]);echo json_encode(['ok'=>true]);exit;}
echo json_encode(['ok'=>false,'error'=>'Método no permitido']);
}catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();http_response_code(500);echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
?>
