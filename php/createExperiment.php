<?php


if(isset($_POST['experiment-id']) && isset($_POST['title'])){
    //echo($_POST['experiment-id']);
    $title=substr($_POST['title'],0,100);
    $id=substr($_POST['experiment-id'],0,100);
    $result=Array("experiment-id"=>$id);
    mkdir("../results/".$id);
    file_put_contents("../results/".$id."/title.txt", $_POST['title']);
    echo json_encode($result);
}