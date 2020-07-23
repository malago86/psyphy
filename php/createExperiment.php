<?php

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");

require_once("functions.php");

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
    
if(file_exists('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json'))
    $firebase = (new Factory)->withServiceAccount('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
else
    $firebase = (new Factory)->withServiceAccount(getenv("firebase_secret"));
    
$storage = $firebase->createStorage();
$storageClient = $storage->getStorageClient();
$defaultBucket = $storage->getBucket();

if(isset($_POST['experiment-id']) && isset($_POST['title']) && isset($_POST['experiment-data'])){
    //echo($_POST['experiment-id']);
    $jsondata = json_decode($_POST['experiment-data']);
    $title=substr($_POST['title'],0,100);
    $id=sanitize_id($_POST['experiment-id'],0,100);
    if(strpos($id,".") == false){
        $result=Array("experiment-id"=>$id);
        if(!is_dir("../results/".$id))
            mkdir("../results/".$id);
        file_put_contents("../results/".$id."/title.txt", $title);
        file_put_contents("../experiment/".$id.".json", json_encode($jsondata));

        $object = $defaultBucket->object("experiment/".$id.".json");
        if(!$object->exists()){ //we don't want to replace the file
            $defaultBucket->upload(json_encode($jsondata),
            [
                'name' => "experiment/".$id.".json"
            ]);

            $defaultBucket->upload($title,
            [
                'name' => "results/".$id."/title.txt"
            ]);
        }
        echo json_encode($result);
    }
}elseif(isset($_POST['load-id']) && isset($_POST['participant-id'])){
    $id=sanitize_id($_POST['load-id']);
    $participant=sanitize_participant($_POST['participant-id']);
    if(strpos($id,".") == false){
        $participant=($_POST['participant-id']);
        echo getFileCloud("results/".$id."/".$participant."/".$participant.".pso",$defaultBucket);
    }
}elseif(isset($_POST['load-id'])){
    $id=sanitize_id($_POST['load-id']);
    if(strpos($id,".") == false){
        if(!is_dir("../results/".$id))
            mkdir("../results/".$id);
        echo getFileCloud("experiment/".$id.".json",$defaultBucket);
    }
}