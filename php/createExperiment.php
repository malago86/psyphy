<?php


if(isset($_POST['experiment-id']) && isset($_POST['title']) && isset($_POST['experiment-data'])){
    //echo($_POST['experiment-id']);
    $jsondata = json_decode($_POST['experiment-data']);
    $title=substr($_POST['title'],0,100);
    $id=substr($_POST['experiment-id'],0,100);
    $result=Array("experiment-id"=>$id);
    mkdir("../results/".$id);
    file_put_contents("../results/".$id."/title.txt", $_POST['title']);
    file_put_contents("../experiment/".$id.".json", json_encode($jsondata));
    echo json_encode($result);
}