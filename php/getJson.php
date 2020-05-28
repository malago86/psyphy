<?
if(isset($_GET['id'])){
    $id = $_GET['id'];
    $URL="https://drive.google.com/uc?export=view&id=".$id;
    $result=file_get_contents($URL);
    if(isJson($result))
        echo $result;
    die();
}

function isJson($string) {
    json_decode($string);
    return (json_last_error() == JSON_ERROR_NONE);
}