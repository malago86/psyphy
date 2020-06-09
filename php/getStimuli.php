<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");
if(file_exists("google-api-php-client-2.4.1/vendor/autoload.php"))
    require_once("google-api-php-client-2.4.1/vendor/autoload.php");




if(file_exists("../credentials/credentials.json"))
    $client = new Google_Client();
    $client->setAuthConfig('../credentials/credentials.json');
else{
    $config = [
        'client_secret' => getenv('client_secret'),
        'client_id' => getenv('client_id'),
        'redirect_uri' => getenv('redirect_uri')
    ];
    $client = new Google_Client($config);
}
$client->addScope('https://www.googleapis.com/auth/drive');

$service = new Google_Service_Drive($client);

if(isset($_GET['file-id'])){
    $fileId=$_GET['file-id'];

    $file=$service->files->get($fileId, array('alt' => 'media'));
    /*$results = $service->files->get($fileId, array("alt" => "media"));

    if($results->getResponseHttpCode() == 200){
        print_r($results->getResponseBody());
    }*/
    //print_r(get_class_methods($file));
//print_r($file->getHeaders());

header('Content-Type: application/octet-stream');
header('Content-Type: ' . $file->getHeaders()["Content-Type"][0]);
//header('Content-Disposition: attachment; filename='.basename($this->real_file));
//header('Content-Disposition: attachment; filename=stimuli');
header('Expires: 0');
header('Pragma: public');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
//header('Content-Length: ' . get_real_size($this->real_file));
header("Content-Description: File Transfer");
//header('Content-Length: ' . $file->getFileSize());

    echo($file->getBody());
/*
    $httpRequest = new Google_HttpRequest($file->getDownloadUrl(), 'GET', null, null);
    $httpRequest = $service->getClient()->getAuth()->authenticatedRequest($httpRequest);
    if ($httpRequest->getResponseHttpCode() == 200) {
        return $httpRequest->getResponseBody();
    } else {
        // An error occurred.
        return null;
    }*/
    

}
